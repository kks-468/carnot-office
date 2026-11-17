package kr.carnot.office;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import jakarta.servlet.http.Cookie;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 실제 PostgreSQL(carnot_test)에 시연 데이터를 넣고 로그인 → 불러오기 → 저장 권한을 확인해요.
 * DB 주소는 CARNOT_TEST_DB_URL로 바꿀 수 있어요.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ApiFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @BeforeAll
    static void cleanDb(@Autowired Flyway flyway, @Autowired kr.carnot.office.demo.DemoSeeder seeder) throws Exception {
        flyway.clean();
        flyway.migrate();
        seeder.run(null);
    }

    /** 로그인하고 세션 쿠키(SESSION)를 돌려줘요. */
    Cookie login(String org, String id) throws Exception {
        var res = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"orgCode\":\"" + org + "\",\"login\":\"" + id + "\",\"password\":\"demo1234\"}")).andExpect(status().isOk()).andReturn().getResponse();
        Cookie c = res.getCookie("SESSION");
        assertThat(c).isNotNull();
        return c;
    }

    JsonNode state(Cookie s) throws Exception {
        return om.readTree(mvc.perform(get("/api/state").cookie(s)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    JsonNode sync(Cookie s, String body) throws Exception {
        return om.readTree(mvc.perform(post("/api/sync").cookie(s).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void 로그인_없이는_불러올_수_없다() throws Exception {
        mvc.perform(get("/api/state")).andExpect(status().isUnauthorized());
    }

    @Test
    void 틀린_비밀번호는_거절한다() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"orgCode\":\"saesol\",\"login\":\"seoyun.kim\",\"password\":\"nope1234\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void 다른_기관의_집행은_합계만_보인다() throws Exception {
        JsonNode d = state(login("gaon", "wooseok.jung"));
        boolean detail = false, agg = false;
        for (JsonNode e : d.get("entries")) {
            if ("sa".equals(e.path("org").asText())) {
                if (e.path("agg").asBoolean()) agg = true;
                else detail = true;
            }
        }
        assertThat(detail).isFalse();
        assertThat(agg).isTrue();
        assertThat(d.get("appr").size()).isZero();
    }

    @Test
    void 다른_기관_문서는_고칠_수_없다() throws Exception {
        Cookie ga = login("gaon", "wooseok.jung");
        // sa 기관의 집행(아이디 3)을 덮어쓰려고 하면 거절
        JsonNode r = sync(ga, "{\"upserts\":[{\"kind\":\"entry\",\"id\":\"3\",\"data\":{\"id\":3,\"org\":\"ga\",\"amount\":1}}]}");
        assertThat(r.get("rejected").size()).isEqualTo(1);
        // 우리 기관 새 공지는 저장
        r = sync(ga, "{\"upserts\":[{\"kind\":\"notice\",\"id\":\"n-test\",\"data\":{\"id\":\"n-test\",\"org\":\"ga\",\"title\":\"점검\"}}]}");
        assertThat(r.get("rejected").size()).isZero();
        assertThat(state(login("saesol", "seoyun.kim")).get("notices").toString()).doesNotContain("n-test");
    }

    @Test
    void 참여기관은_과제_이름을_못_바꾼다() throws Exception {
        Cookie ga = login("gaon", "wooseok.jung");
        JsonNode a = null;
        for (JsonNode p : state(ga).get("projects")) if ("A".equals(p.path("id").asText())) a = p;
        String name = a.get("name").asText();
        ((com.fasterxml.jackson.databind.node.ObjectNode) a).put("name", "바꿔치기");
        JsonNode r = sync(ga, "{\"upserts\":[{\"kind\":\"project\",\"id\":\"A\",\"data\":" + a + "}]}");
        assertThat(r.get("corrected").get(0).at("/data/name").asText()).isEqualTo(name);
    }

    @Test
    void 급여_열람_권한이_없으면_급여를_걸러_보내고_못_고친다() throws Exception {
        Cookie p1 = login("saesol", "seoyun.kim"); // 연구책임자: 시연 설정상 급여 열람 권한 없음
        JsonNode d = state(p1);
        assertThat(d.at("/me/canPay").asBoolean()).isFalse();
        assertThat(d.get("raises").size()).isZero();
        JsonNode r = sync(p1, "{\"docs\":{\"pay\":{}}}");
        assertThat(r.get("rejected").size()).isEqualTo(1);

        Cookie p4 = login("saesol", "minjae.choi"); // 연구행정팀: 급여 열람 권한 있음
        assertThat(state(p4).at("/me/canPay").asBoolean()).isTrue();

        // 관리자가 '인건비 계산용 급여 보이기'를 끄면 p1은 자기 급여만 받아요
        Cookie admin = login("saesol", "admin");
        JsonNode org = state(admin).at("/orgs/sa").deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) org.withObject("/acl").withObject("/pay")).put("forResearch", false);
        assertThat(sync(admin, "{\"upserts\":[{\"kind\":\"org\",\"id\":\"sa\",\"data\":" + org + "}]}").get("rejected").size()).isZero();
        JsonNode pay = state(p1).at("/pay/2026");
        assertThat(pay.has("p1")).isTrue();
        assertThat(pay.has("p2")).isFalse();
        // 다시 켜면 함께 참여하는 과제 인력의 급여도 받아요
        ((com.fasterxml.jackson.databind.node.ObjectNode) org.withObject("/acl").withObject("/pay")).put("forResearch", true);
        sync(admin, "{\"upserts\":[{\"kind\":\"org\",\"id\":\"sa\",\"data\":" + org + "}]}");
        assertThat(state(p1).at("/pay/2026").has("p2")).isTrue();
    }

    @Test
    void 과제별로_열람_범위를_좁히면_그_과제는_보내지_않는다() throws Exception {
        Cookie admin = login("saesol", "admin");
        JsonNode org = state(admin).at("/orgs/sa").deepCopy();
        // 과제 C는 관리자만 보게
        ((com.fasterxml.jackson.databind.node.ObjectNode) org.withObject("/acl").withObject("/projects")).putObject("C");
        JsonNode r = sync(admin, "{\"upserts\":[{\"kind\":\"org\",\"id\":\"sa\",\"data\":" + org + "}]}");
        assertThat(r.get("rejected").size()).isZero();

        Cookie p1 = login("saesol", "seoyun.kim");
        JsonNode d = state(p1);
        for (JsonNode p : d.get("projects")) assertThat(p.path("id").asText()).isNotEqualTo("C");
        for (JsonNode e : d.get("entries")) assertThat(e.path("proj").asText()).isNotEqualTo("C");
        // 숨긴 과제에 집행을 넣으려 해도 거절
        r = sync(p1, "{\"upserts\":[{\"kind\":\"entry\",\"id\":\"x-c\",\"data\":{\"id\":\"x-c\",\"proj\":\"C\",\"org\":\"sa\",\"amount\":1}}]}");
        assertThat(r.get("rejected").size()).isEqualTo(1);
        // 관리자는 언제나 봐요
        boolean adminSees = false;
        for (JsonNode p : state(admin).get("projects")) if ("C".equals(p.path("id").asText())) adminSees = true;
        assertThat(adminSees).isTrue();
        // 비관리자는 열람 권한을 못 바꿔요
        r = sync(p1, "{\"upserts\":[{\"kind\":\"org\",\"id\":\"sa\",\"data\":" + org + "}]}");
        assertThat(r.get("rejected").size()).isEqualTo(1);
    }
}
