package kr.carnot.office.state;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** 참여기관(비주관)이 연구단 과제를 저장할 때 자기 기관 몫만 반영되는지 */
class ProjectGuardTest {
    private final ObjectMapper om = new ObjectMapper();

    private ObjectNode json(String s) throws Exception {
        return (ObjectNode) om.readTree(s.replace('\'', '"'));
    }

    private final String stored = """
        {'id':'A','name':'원래 이름','parts':[{'org':'sa','role':'주관','status':'수락','budget':{'x':1}},{'org':'ga','role':'참여','tier':'1세부','status':'수락','budget':{'x':2}}],
         'members':['p1','p5'],'goals':[{'id':'g1','o':{'sa':{'1':3},'ga':{'1':1}}}],
         'tasks':[{'id':'t1','org':'sa','prog':10},{'id':'t2','org':'ga','prog':20}],'plan':{'sa':{'a':1},'ga':{'a':2}},'history':['h1']}
        """;

    @Test
    void 우리_기관_몫만_바뀐다() throws Exception {
        ObjectNode in = json("""
            {'id':'A','name':'바꾼 이름','parts':[{'org':'sa','role':'참여','status':'수락','budget':{'x':999}},{'org':'ga','role':'주관','tier':'총괄','status':'수락','budget':{'x':5}}],
             'members':['p5','p6'],'goals':[{'id':'g1','o':{'sa':{'1':0},'ga':{'1':4}}},{'id':'g2','o':{'ga':{'1':1}}}],
             'tasks':[{'id':'t1','org':'sa','prog':99},{'id':'t2','org':'ga','prog':55}],'plan':{'sa':{'a':0},'ga':{'a':7}},'history':['h2','h1']}
            """);
        ObjectNode out = ProjectGuard.mergeNonLead(json(stored), in, "ga", Set.of("p5", "p6"));
        assertThat(out.get("name").asText()).isEqualTo("원래 이름");
        assertThat(out.at("/parts/0/budget/x").asInt()).isEqualTo(1);
        assertThat(out.at("/parts/1/budget/x").asInt()).isEqualTo(5);
        assertThat(out.at("/parts/1/role").asText()).isEqualTo("참여");
        assertThat(out.at("/parts/1/tier").asText()).isEqualTo("1세부");
        assertThat(out.get("members").toString()).isEqualTo("[\"p1\",\"p5\",\"p6\"]");
        assertThat(out.at("/goals/0/o/sa/1").asInt()).isEqualTo(3);
        assertThat(out.at("/goals/0/o/ga/1").asInt()).isEqualTo(4);
        assertThat(out.get("goals").size()).isEqualTo(2);
        assertThat(out.at("/tasks/0/prog").asInt()).isEqualTo(10);
        assertThat(out.at("/tasks/1/prog").asInt()).isEqualTo(55);
        assertThat(out.at("/plan/sa/a").asInt()).isEqualTo(1);
        assertThat(out.at("/plan/ga/a").asInt()).isEqualTo(7);
        assertThat(out.get("history").size()).isEqualTo(2);
    }

    @Test
    void 초대받은_기관은_수락만_할_수_있다() throws Exception {
        ObjectNode st = json(stored.replace("'org':'ga','role':'참여','tier':'1세부','status':'수락'", "'org':'ga','role':'참여','tier':'1세부','status':'초대 중'"));
        ObjectNode in = st.deepCopy();
        ((ObjectNode) in.at("/parts/1")).put("status", "수락").put("role", "주관");
        in.put("name", "x");
        ObjectNode out = ProjectGuard.mergeNonLead(st, in, "ga", Set.of("p5"));
        assertThat(out.at("/parts/1/status").asText()).isEqualTo("수락");
        assertThat(out.at("/parts/1/role").asText()).isEqualTo("참여");
        assertThat(out.get("name").asText()).isEqualTo("원래 이름");
    }
}
