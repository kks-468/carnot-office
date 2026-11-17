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
}
