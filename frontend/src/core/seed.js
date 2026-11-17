// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { A } from './actions';
import { migrateLines, seedAppr } from './approval';
import { mkEntry, ratioBudget } from './budget';
import { CHK, LOGIN, TPL_DEFAULT } from './catalog';
import { expert, me, proj } from './org';
import { receiptImage } from './print';
import { seedPerf, seedPropYears } from './seedfns';
import { months, short, shortName, sum, uid } from './util';

/** 시연 데이터를 S에 채워요. 서버 데이터를 쓰면 호출하지 않아요. */
export function seedDemo(){
Object.assign(S,{
  view:'sa',menu:'admin',tab:'meet',sub:'cards',psub:'summary',docFilter:'all',
  modal:null,signup:null,f:{},libSel:null,collect:[{id:'c1',proj:'A',title:'1차년도 연차실적보고서 취합',due:'2026-09-05',tpl:'연차실적보고서_양식_v2.hwp',by:'sa',subs:{sa:{name:'새솔대_1차년도_연차실적_본문.hwp',date:'2026-09-01',by:'p1'},ga:{name:'가온소재_1세부_실적.hwp',date:'2026-09-03',by:'p5'}}},{id:'c2',proj:'A',title:'2차년도 1분기 진도 점검 자료',due:'2026-12-20',tpl:'분기_진도점검표.xlsx',by:'sa',subs:{sa:{name:'새솔대_1분기_진도점검.xlsx',date:'2026-11-05',by:'p4'}}}],expGroups:['소재·공정','안전·평가','AI·비전','지식재산·법무'],pay:{2026:{p1:6500000,p2:4200000,p3:2500000,p4:4000000,p8:2500000,p9:3800000,p10:1000000,p5:6000000,p6:4800000,p11:3600000,p7:5500000}},payYear:2026,ins:{},rkind:{p5:{A:'현물'},p11:{A:'현물'}},teamSel:null,teamTab:'sum',propSel:null,stTab:'acct',raises:[],payFree:{2025:{},2026:{},2027:{}},pgrade:{},grades:{},rview:'proj',leaveAdj:{},leaveSet:{},leaveYr:null,leaveOpen:null,ckf:'all',cuf:'all',
  notices:[{id:'n1',org:'sa',title:'11월 연구비 정산 일정 안내',body:'11월 집행분 증빙은 11월 28일(금)까지 연구행정 관리에 올려 주세요.\n앱 영수증 미연결 건과 증빙 미비 건을 먼저 확인해 주세요.',by:'p4',date:'2026-11-06',pin:true},
    {id:'n2',org:'sa',title:'사내 NAS 백업 작업 안내 (11/14 토)',body:'11월 14일(토) 09:00~13:00 NAS 백업 작업으로 공유 폴더 접속이 제한돼요.',by:'p0',date:'2026-11-05'},
    {id:'n3',org:'sa',title:'연말 연차 사용 계획 제출 요청',body:'12월 연차 사용 계획을 회사일정에 11월 20일까지 등록해 주세요.',by:'p13',date:'2026-11-03'},
    {id:'n4',org:'sa',title:'연구윤리 정기 교육 (11/12)',body:'11월 12일(목) 14:00 공학관 302호. 참여연구원은 모두 참석해 주세요.',by:'p4',date:'2026-10-29'}],
  cevents:[{id:'ce1',kind:'연차',start:'2026-10-30',end:'2026-10-30',pid:'p2',by:'p2'},{id:'ce2',kind:'연차',start:'2026-11-02',end:'2026-11-02',pid:'p2',by:'p2'},{id:'ce3',kind:'연차',start:'2026-11-05',end:'2026-11-05',pid:'p3',by:'p3'},
    {id:'ce4',kind:'반차',start:'2026-11-06',end:'2026-11-06',time:'14:00',time2:'18:00',pid:'p10',by:'p10'},{id:'ce13',kind:'외출',start:'2026-11-07',end:'2026-11-07',time:'10:00',time2:'12:00',pid:'p3',by:'p3',title:'병원'},{id:'ce5',kind:'연차',start:'2026-11-09',end:'2026-11-09',pid:'p10',by:'p10'},
    {id:'ce6',kind:'출장',start:'2026-11-10',end:'2026-11-11',pid:'p1',by:'p1',title:'가온소재 대전 공장 파일럿 라인 점검'},{id:'ce7',kind:'출장',start:'2026-11-10',end:'2026-11-11',pid:'p2',by:'p2',title:'가온소재 대전 공장 파일럿 라인 점검'},
    {id:'ce8',kind:'교육',start:'2026-11-12',end:'2026-11-12',time:'14:00',pid:'p4',by:'p4',title:'연구윤리 정기 교육 (공학관 302호)'},{id:'ce9',kind:'회의',start:'2026-11-09',end:'2026-11-09',time:'09:30',pid:'p13',by:'p13',title:'주간 업무 회의'},
    {id:'ce10',kind:'외근',start:'2026-11-07',end:'2026-11-07',pid:'p9',by:'p9',title:'참여 공장 A 데이터 수집'},{id:'ce11',kind:'행사',start:'2026-11-20',end:'2026-11-20',pid:'p1',by:'p1',title:'연구단 합동 워크숍 (대전)'},{id:'ce12',kind:'연차',start:'2026-11-27',end:'2026-11-27',pid:'p8',by:'p8'}],
  reports:[
    {id:'r1',week:'2026-11-01',cat:'연구 프로젝트',client:'산업통상부',title:'차세대 이차전지 분리막 소재 기술개발',proj:'A',last:'- 2차년도 착수 회의 (10.20) 후속 정리\n- 바인더 후보 3종 시료 확보',next:'- 바인더 조성 검토 회의 (11.04)\n- 코팅층 2μm 접착력 시험 착수',note:'11월 중 분리막 시험 결과 공유 회의 개최',members:'PM: 김서윤 / 참여: 박도현, 이하린, 정다은',by:'p1'},
    {id:'r2',week:'2026-11-01',cat:'연구 프로젝트',client:'산업통상부',title:'차세대 이차전지 분리막 소재 기술개발',proj:'A',last:'- 열수축률 재측정 (150℃·1h) 3회',next:'- 셀 안전성 평가 시험 설계안 작성\n- 윤채원 책임연구원 자문 일정 확정',note:'',members:'',by:'p2'},
    {id:'r3',week:'2026-11-01',cat:'연구 프로젝트',client:'중소벤처기업부',title:'제조 현장 AI 품질검사 실증',proj:'B',last:'- 야간 조명 보정 전처리 1차 적용',next:'- 참여 공장 A 데이터 수집 (11.07)\n- 재현율 비교 리포트',note:'조명 보정 모델 점검 회의 11.12',members:'PM: 김서윤 / 참여: 오지민',by:'p9'},
    {id:'r4',week:'2026-11-01',cat:'제안 프로젝트',client:'산업통상부',title:'수소 저장용 고분자 복합소재 개발',proj:'D',last:'- 연구단 역할 분담안 초안',next:'- 기관별 예산 초안 취합 (12.08 마감)\n- 제안서 3장 작성',note:'제안서 접수 마감 12.15',members:'총괄: 새솔대 / 1세부: 가온소재',by:'p1'},
    {id:'r5',week:'2026-11-01',cat:'행정업무',client:'-',title:'회계·인사 업무',proj:'',last:'- 10월 귀속 급여, 연구비 정산 보고\n- 10월 법인카드 정리',next:'- 11월 연구비 정산 일정 공지\n- 연차 사용 계획 취합',note:'',members:'담당: 최민재',by:'p4'},
    {id:'r6',week:'2026-11-01',cat:'내부 프로젝트',client:'-',title:'연구행정 지원 플랫폼 도입',proj:'',last:'- 결재선·조직도 설정 검토',next:'- 전 직원 계정 활성화 안내\n- 업무보고 시범 운영',note:'',members:'담당: 서경민',by:'p13'},
    {id:'r7',week:'2026-10-25',cat:'연구 프로젝트',client:'산업통상부',title:'차세대 이차전지 분리막 소재 기술개발',proj:'A',last:'- 2차년도 착수 회의 준비',next:'- 2차년도 착수 회의 후속 정리\n- 바인더 후보 3종 시료 확보',note:'',members:'PM: 김서윤',by:'p1'}],
  auth:null,creds:{p0:'admin'},temp:{p10:'temp1234'},stamps:{p4:{kind:'square'}},orgSeal:{},docSeal:true,ls:{form:'',simP:'',simF:'exec',simAmt:'6000000'},docFooter:'',docSign:true,srcOv:{},fm:{tab:'apv',sel:'exec',tsel:'trip',item:'연구활동비'},me:null,apv:{box:'home',doc:null,edit:null,q:'',comment:''},appr:[],pcal:{y:2026,m:10},schf:'all',newEntry:null,cal:{y:2026,m:10},mwiz:null,cap:null,
  evf:{proj:'all',item:'all',sub:'all',st:'all'},files:{},made:{},subf:'all',
  orgs:{
    sa:{code:'saesol',name:'새솔대학교 산학협력단',short:'새솔대',type:'대학',numType:'고유번호',number:'123-82-45678',subs:[{name:'스마트소재연구실',status:'승인'},{name:'지능제조연구실',status:'승인'}],limit:50000,levels:[{k:'L1',n:'산학협력단장'},{k:'L2',n:'본부장'},{k:'L3',n:'팀장'},{k:'L4',n:'직원'}],units:[{name:'새솔대학교 산학협력단',parent:''},{name:'연구지원본부',parent:'새솔대학교 산학협력단'},{name:'연구행정팀',parent:'연구지원본부'},{name:'스마트소재연구실',parent:'새솔대학교 산학협력단'},{name:'지능제조연구실',parent:'새솔대학교 산학협력단'}],lineTpl:[{lv:'L3',type:'결재'},{dept:'연구행정팀',type:'결재'},{lv:'L2',type:'결재'}],formLines:{leave:[{lv:'L3',type:'결재'}]},amtRules:[{min:5000000,lv:'L1'}]},
    ga:{code:'gaon',name:'(주)가온소재',short:'가온소재',type:'기업',size:'중소기업',numType:'사업자등록번호',number:'222-81-33445',subs:[{name:'기업부설연구소',status:'승인'}],limit:50000,levels:[{k:'L1',n:'대표'},{k:'L2',n:'본부장'},{k:'L3',n:'팀장'},{k:'L4',n:'직원'}],units:[{name:'(주)가온소재',parent:''},{name:'기업부설연구소',parent:'(주)가온소재'}],lineTpl:[{lv:'L3',type:'결재'},{lv:'L2',type:'결재'},{lv:'L1',type:'결재'}],formLines:{},amtRules:[]},
    nu:{code:'nuritech',name:'누리테크(주)',short:'누리테크',type:'기업',size:'중소기업',numType:'사업자등록번호',number:'333-86-77889',subs:[],limit:50000},
  },
  people:[
    {id:'p1',name:'김서윤',org:'sa',role:'연구책임자',unit:'스마트소재연구실',level:'L3'},
    {id:'p2',name:'박도현',org:'sa',role:'박사후연구원',unit:'스마트소재연구실'},
    {id:'p3',name:'이하린',org:'sa',role:'대학원생',unit:'스마트소재연구실'},
    {id:'p4',name:'최민재',org:'sa',role:'행정 담당',unit:'연구행정팀',level:'L3'},
    {id:'p5',name:'정우석',org:'ga',role:'참여 책임자',unit:'기업부설연구소',level:'L3'},
    {id:'p6',name:'한지아',org:'ga',role:'선임연구원',unit:'기업부설연구소'},
    {id:'p7',name:'강태오',org:'nu',role:'참여 책임자',unit:'기술본부',level:'L3'},
    {id:'p8',name:'정다은',org:'sa',role:'대학원생',unit:'스마트소재연구실'},
    {id:'p9',name:'오지민',org:'sa',role:'연구원',unit:'지능제조연구실'},
    {id:'p10',name:'윤태호',org:'sa',role:'학부연구생',unit:'스마트소재연구실'},
    {id:'p12',name:'한정훈',org:'sa',role:'산학협력단장',unit:'새솔대학교 산학협력단',level:'L1'},
    {id:'p13',name:'서경민',org:'sa',role:'연구지원본부장',unit:'연구지원본부',level:'L2'},{id:'p0',name:'관리자',org:'sa',role:'기관 관리자',unit:'연구지원본부',level:'L1',login:'admin',admin:true},
    {id:'p14',name:'윤성호',org:'ga',role:'대표이사',unit:'(주)가온소재',level:'L1'},
    {id:'p11',name:'배수아',org:'ga',role:'연구원',unit:'기업부설연구소'},
  ],
  experts:[
    {id:'x1',name:'오세준',org:'한결공과대학교',field:'이차전지 소재',group:'소재·공정',phone:'010-0000-0001',email:'sejun.oh@hangyeol.ac.kr',career:'한결공과대학교 화학공학과 교수. 분리막 코팅 및 바인더 소재 연구 15년. 이차전지 소재 국책과제 평가위원(2023~).'},
    {id:'x2',name:'윤채원',org:'미래에너지연구원',field:'안전성 평가',group:'안전·평가',phone:'010-0000-0002',email:'cw.yoon@mirae-energy.re.kr',career:'미래에너지연구원 책임연구원. 셀 단위 열폭주·관통 시험 설계 12년. 배터리 안전성 시험 표준 개발 참여.'},
    {id:'x3',name:'서지훈',org:'다온AI(주)',field:'머신비전',group:'AI·비전',phone:'010-0000-0003',email:'jh.seo@daonai.co.kr',career:'다온AI 기술이사. 제조 라인 비전 검사 시스템 구축 30여 건. 조명 변화 대응 영상 전처리 전문.'},
    {id:'x4',name:'강민서',org:'한국소재분석원',field:'소재 분석',group:'소재·공정',phone:'010-0000-0004',email:'ms.kang@kmat.re.kr',career:'한국소재분석원 선임연구원. 코팅층 단면 분석·열분석(TGA/DSC) 10년.'},
    {id:'x5',name:'임도윤',org:'세이프랩(주)',field:'열폭주 시험',group:'안전·평가',phone:'010-0000-0005',email:'dy.lim@safelab.co.kr',career:'세이프랩 시험소장. 배터리 셀 열폭주·못 관통 시험 300건 이상 수행.'},
    {id:'x6',name:'노하은',org:'법무법인 다솜',field:'기술계약·IP',group:'지식재산·법무',phone:'010-0000-0006',email:'he.noh@dasom-law.com',career:'법무법인 다솜 변리사. 소재 특허 출원과 공동연구 기술이전 계약 자문.'},
    {id:'x7',name:'문재현',org:'한빛대학교',field:'산업 AI',group:'AI·비전',phone:'010-0000-0007',email:'jh.moon@hanbit.ac.kr',career:'한빛대학교 산업공학과 교수. 제조 공정 이상 탐지 모델 연구.'},
  ],
  projects:[
    {id:'A',short:'연구A',name:'차세대 이차전지 분리막 소재 기술개발',ministry:'산업통상부',start:'2025-10-01',end:'2030-09-30',year:'2차년도 (2026.10.1~2027.9.30)',ys:'2026-10',team:'스마트소재연구실',phase:'추진',cur:2,years:[{no:1,start:'2025-10-01',end:'2026-09-30',closed:{date:'2026-10-15',by:'p4'},budget:{sa:ratioBudget(400000000),ga:ratioBudget(170000000)}},{no:2,start:'2026-10-01',end:'2027-09-30'}],
     code:'CN-A26K',events:[{date:'2026-09-05',kind:'보고서 마감',title:'1차년도 연차실적보고서 취합 마감',org:'sa'},{date:'2026-11-20',kind:'워크숍',title:'2차년도 연구단 합동 워크숍 (대전)',org:'sa'},{date:'2026-12-20',kind:'보고서 마감',title:'1분기 진도 점검 자료 제출',org:'sa'},{date:'2027-01-14',kind:'평가',title:'산업통상부 연차 점검 회의',org:'sa'}],
     parts:[{org:'sa',role:'주관',tier:'총괄',status:'수락',budget:ratioBudget(420000000)},{org:'ga',role:'세부주관',tier:'1세부',status:'수락',budget:ratioBudget(180000000),inkind:{'인건비':36000000}},{org:'nu',role:'참여',tier:'1세부',status:'초대 중',budget:ratioBudget(60000000),inkind:{'인건비':12000000}}],
     members:['p1','p2','p3','p4','p5','p6','p8','p10','p11'],mplan:{1:[{m1:1,m2:4,task:'세라믹 코팅 소재 설계',detail:'고내열 세라믹 입자 선정과 코팅 슬러리 조성 설계',org:'sa'},{m1:3,m2:8,task:'분리막 시제품 제작',detail:'코팅 분리막 시제품 3종 제작과 열수축률 평가',org:'sa'},{m1:6,m2:12,task:'파일럿 라인 조건 시험',detail:'코팅 속도별 코팅 균일도 시험',org:'ga'}],2:[{m1:1,m2:3,task:'바인더 조성 최적화',detail:'코팅층 2μm 이하에서도 접착력을 확보하는 바인더 조성 재설계',org:'sa'},{m1:2,m2:5,task:'파일럿 라인 코팅 속도 향상',detail:'코팅 속도 15m/min에서 두께 편차 ±5% 이내 확보',org:'ga'},{m1:2,m2:6,task:'셀 단위 안전성 평가',detail:'파우치 셀 열폭주·관통 시험 설계와 1차 안전성 평가',org:'sa'},{m1:6,m2:10,task:'폭 500mm 연속 코팅 공정 조건 확립',detail:'광폭 연속 코팅 공정 변수 확립',org:'ga'},{m1:10,m2:12,task:'2차년도 성능 검증 및 연차보고',detail:'목표 지표 검증과 연차실적보고서 작성',org:'sa'}]},
     history:['2026.10.15 1차년도 마감 · 연차 정산 자료 자료실 이관','2026.10.01 2차년도 시작: 이하린 참여율 50%→40%','2026.03.02 한지아 합류(가온소재)'],plan:{},subplan:{}},
    {id:'B',short:'연구B',name:'제조 현장 AI 품질검사 실증',ministry:'중소벤처기업부',start:'2026-04-01',end:'2028-03-31',year:'1차년도 (2026.4.1~2027.3.31)',ys:'2026-04',team:'지능제조연구실',phase:'추진',cur:1,years:[{no:1,start:'2026-04-01',end:'2027-03-31'}],
     code:'CN-B41M',mplan:{1:[{m1:1,m2:3,task:'불량 이미지 데이터 수집',detail:'참여 공장 조립 라인 불량 이미지 수집과 라벨링',org:'sa'},{m1:3,m2:6,task:'불량 검출 모델 학습',detail:'불량 검출 모델 학습과 재현율 평가',org:'sa'},{m1:6,m2:9,task:'조명 보정 전처리 적용',detail:'야간 교대 시간대 조명 변화에 대응하는 영상 전처리 적용',org:'sa'},{m1:8,m2:12,task:'현장 실증 및 사용성 점검',detail:'참여 공장 현장 실증과 작업자 사용성 점검',org:'sa'}]},events:[{date:'2026-12-03',kind:'회의',title:'실증 현장 합동 점검',org:'sa'}],parts:[{org:'sa',role:'주관',tier:'총괄',status:'수락',budget:ratioBudget(150000000)}],members:['p1','p2','p4','p9'],history:['2026.04.01 과제 시작'],plan:{},subplan:{}},
    {id:'C',short:'연구C',name:'스마트공장 공정 데이터 표준화',ministry:'중소벤처기업부',start:'2024-04-01',end:'2026-03-31',year:'2차년도 (2025.4.1~2026.3.31)',ys:'2025-04',team:'지능제조연구실',phase:'종료',cur:2,years:[{no:1,start:'2024-04-01',end:'2025-03-31',closed:{date:'2025-04-08',by:'p4'},budget:{sa:ratioBudget(75000000)}},{no:2,start:'2025-04-01',end:'2026-03-31',closed:{date:'2026-04-10',by:'p4'},budget:{sa:ratioBudget(80000000)}}],
     code:'CN-C09T',parts:[{org:'sa',role:'주관',tier:'총괄',status:'수락',budget:ratioBudget(80000000)}],members:['p1','p9'],history:['2026.04.10 과제 종료·자료실 이관','2024.04.01 과제 시작'],plan:{},subplan:{},archived:{date:'2026-04-10',by:'p4'}},
    {id:'D',nYears:4,short:'',name:'수소 저장용 고분자 복합소재 개발',ministry:'산업통상부',call:'2027년 소재부품기술개발사업 (이종기술융합형)',due:'2026-12-15',start:'2027-04-01',end:'2030-12-31',year:'',ys:'2027-04',team:'스마트소재연구실',phase:'제안',cur:0,years:[],code:'CN-D77Q',
     events:[{date:'2026-11-18',kind:'회의',title:'제안서 기관별 역할 조율 회의',org:'sa'},{date:'2026-12-08',kind:'보고서 마감',title:'기관별 사업계획서·예산 초안 제출',org:'sa'},{date:'2026-12-15',kind:'평가',title:'제안서 접수 마감 (범부처통합연구지원시스템)',org:'sa'}],
     parts:[{org:'sa',role:'주관',tier:'총괄',status:'수락',budget:ratioBudget(0),prop:{G:300000000,share:0,cashPct:0,ind:17,staff:[{pid:'p1',rate:20,months:9,fund:'현금'},{pid:'p2',rate:40,months:9,fund:'현금'},{pid:'p3',rate:60,months:9,fund:'현금'},{pid:'p8',rate:50,months:9,fund:'현금'}],items:{'연구시설·장비비':{c:40000000},'연구재료비':{c:80000000},'연구활동비':{c:18000000},'연구수당':{c:9000000}}}},
       {org:'ga',role:'세부주관',tier:'1세부',status:'수락',budget:ratioBudget(0),prop:{G:200000000,share:25,cashPct:10,ind:5,staff:[{pid:'p5',rate:30,months:9,fund:'현물'},{pid:'p6',rate:50,months:9,fund:'현금'},{pid:'p11',rate:40,months:9,fund:'현물'}],items:{'연구재료비':{c:70000000},'연구시설·장비비':{c:30000000,k:15000000},'연구활동비':{c:12000000}}}},
       {org:'nu',role:'참여',tier:'1세부',status:'신청 중',budget:ratioBudget(0),msg:'1세부 공정 실증(파일럿 성형) 담당으로 참여하려고 해요.',reqDate:'2026-11-04'}],
     members:['p1','p2','p3','p8','p5','p6','p11'],history:['2026.11.02 제안 과제 등록'],plan:{},subplan:{}},
  ],
  rates:{p8:{A:50},p9:{B:60},p10:{A:30},p11:{A:40},p1:{A:30,B:20},p2:{A:60,B:30},p3:{A:40},p4:{A:10,B:10},p5:{A:25},p6:{A:60},p7:{}},
  meetings:[
    {id:'m1',proj:'A',date:'2026-10-20',start:'14:00',end:'16:00',place:'공학관 302호',topic:'2차년도 착수 회의',att:['p1','p2','p3','p5'],exp:[],status:'완료',entry:3,doc:'d5'},
    {id:'m2',proj:'B',date:'2026-10-28',start:'10:00',end:'11:30',place:'지능제조연구실',topic:'실증 데이터 점검 회의',att:['p1','p2','p4'],exp:['x3'],status:'완료',entry:null,doc:'d6'},
    {id:'m3',proj:'A',date:'2026-11-04',start:'15:00',end:'16:30',place:'가온소재 회의실',topic:'바인더 조성 검토 회의',att:['p2','p3','p6'],exp:['x1'],status:'예비',entry:null,doc:null},
    {id:'m4',proj:'A',date:'2026-11-12',start:'14:00',end:'16:00',place:'공학관 302호',topic:'분리막 시험 결과 공유 회의',att:['p1','p2','p5','p6'],exp:['x1'],status:'예비',entry:null,doc:null},
    {id:'m5',proj:'B',date:'2026-11-12',start:'10:00',end:'11:30',place:'지능제조연구실',topic:'조명 보정 모델 점검',att:['p1','p2'],exp:[],status:'예비',entry:null,doc:null},
    {id:'m6',proj:'A',date:'2026-11-25',start:'10:00',end:'12:00',place:'공학관 302호',topic:'셀 안전성 평가 자문 회의',att:['p1','p3'],exp:['x2'],status:'예비',entry:null,doc:null},
    {id:'mc1',proj:'C',date:'2026-02-24',start:'14:00',end:'15:30',place:'지능제조연구실',topic:'최종 성과 점검 회의',att:['p1','p9'],exp:['x7'],status:'완료',entry:16,doc:'d9'},
    {id:'m7',proj:'B',date:'2026-12-10',start:'14:00',end:'15:30',place:'참여 공장 A',topic:'실증 결과 검토',att:['p1','p4'],exp:[],status:'예비',entry:null,doc:null},
  ],
  entries:[],receipts:[],
  docs:[
    {id:'d1',proj:'A',org:'sa',kind:'보고서',share:'전체',date:'2026-09-15',ver:'v2',name:'1차년도 연차실적보고서',paras:[
      '1차년도에는 세라믹 코팅 분리막 시제품 3종을 제작했고, 150℃ 1시간 조건의 열수축률이 기존 대비 62% 감소한 4.1%로 측정되었다.',
      '코팅층 두께를 2μm 이하로 줄이면 접착력이 불안정해지는 현상이 확인되어, 바인더 조성 재검토가 2차년도 과제로 남았다.',
      '가온소재는 파일럿 라인 조건 시험을 수행했으며, 코팅 속도 10m/min 이상에서 균일도 편차가 커지는 결과를 보고했다.',
      '2차년도 목표는 코팅 속도 15m/min에서 두께 편차 ±5% 이내 확보와 셀 단위 안전성 평가 착수이다.']},
    {id:'d2',proj:'A',org:'sa',kind:'제안서',share:'전체',date:'2025-07-20',ver:'v1',name:'연구개발 제안서',paras:[
      '본 과제는 고내열 세라믹 코팅 분리막을 개발해 전기차용 셀의 열 안전성을 높이는 것을 목표로 한다.',
      '주관기관은 코팅 소재와 바인더 설계를, 참여기업은 파일럿 라인 공정 개발과 양산성 검증을 맡는다.',
      '3차년도까지 폭 500mm 파일럿 라인에서 연속 코팅 공정을 확보하고, 5차년도에 셀 업체 품질 인증을 추진한다.']},
    {id:'d3',proj:'A',org:'ga',kind:'보고서',share:'소속',date:'2026-10-10',ver:'v1',name:'파일럿 라인 내부 원가 분석',paras:['가온소재 내부 자료: 파일럿 라인 원가 항목 분석.']},
    {id:'d4',proj:'B',org:'sa',kind:'보고서',share:'전체',date:'2026-09-30',ver:'v1',name:'2분기 실증 중간보고서',paras:[
      '참여 공장 2곳의 조립 라인에서 불량 이미지 1만 2천 장을 수집해 학습 데이터로 구축했다.',
      '현재 모델의 불량 검출 재현율은 91.3%이며, 조명 변화가 큰 야간 교대 시간대에서 성능 저하가 확인되었다.',
      '3분기에는 조명 보정 전처리를 적용하고 현장 작업자 대상 사용성 점검을 진행한다.']},
    {id:'d5',proj:'A',org:'sa',kind:'회의록',share:'소속',date:'2026-10-20',ver:'v1',name:'2026.10.20 회의록: 2차년도 착수 회의',body:'회의록\n\n과제명: 차세대 이차전지 분리막 소재 기술개발\n일시: 2026.10.20 14:00~16:00\n장소: 공학관 302호\n참석자: 김서윤, 박도현, 이하린, 정우석\n안건: 2차년도 착수 회의\n\n논의 내용\n2차년도 코팅 속도 목표(15m/min)와 기관별 역할을 확인함. 바인더 조성은 11월 초 별도 회의에서 검토하기로 함.\n\n결정 사항\n11월 중 분리막 시험 결과 공유 회의 개최.'},
    {id:'d7',proj:'C',org:'sa',kind:'제안서',share:'전체',date:'2024-02-10',ver:'v1',name:'공정 데이터 표준화 제안서',paras:['중소 제조기업의 설비 데이터 형식을 표준화해 공정 분석 비용을 낮추는 것을 목표로 한다.']},
    {id:'d8',proj:'C',org:'sa',kind:'보고서',share:'전체',date:'2026-03-28',ver:'v1',name:'최종보고서',paras:['참여 기업 6곳의 설비 데이터 12종을 표준 형식으로 변환했고, 데이터 준비 시간이 평균 41% 줄었다.','표준 형식은 협회 단체표준으로 제안했다.']},
    {id:'d9',proj:'C',org:'sa',kind:'회의록',share:'소속',date:'2026-02-24',ver:'v1',name:'2026.02.24 회의록: 최종 성과 점검 회의',body:'회의록\n\n과제명: 스마트공장 공정 데이터 표준화\n일시: 2026.02.24 14:00~15:30\n참석자: 김서윤, 오지민, 문재현(전문가)\n\n논의 내용\n최종 성과 지표 달성 여부를 확인함.'},
    {id:'d6',proj:'B',org:'sa',kind:'회의록',share:'소속',date:'2026-10-28',ver:'v1',name:'2026.10.28 회의록: 실증 데이터 점검 회의',body:'회의록\n\n과제명: 제조 현장 AI 품질검사 실증\n일시: 2026.10.28 10:00~11:30\n참석자: 김서윤, 박도현, 최민재, 서지훈(전문가)\n안건: 실증 데이터 점검\n\n논의 내용\n야간 교대 이미지의 조명 편차를 확인하고 보정 방식 두 가지를 비교하기로 함.'},
  ],
});
S.sched=[
  {id:'s1',proj:'A',org:'sa',item:'연구활동비',sub:'야근·특근 식대',date:'2026-11-18',title:'시제품 코팅 야간 작업',amount:120000,status:'예정',att:['p2','p3']},
  {id:'s2',proj:'A',org:'sa',item:'연구활동비',sub:'야근·특근 식대',date:'2026-12-16',title:'셀 조립 특근',amount:150000,status:'예정',att:['p2','p3','p8']},
  {id:'s3',proj:'A',org:'sa',item:'연구활동비',sub:'전문가활용비',date:'2026-11-25',title:'셀 안전성 평가 자문 (윤채원)',amount:300000,status:'예정',exp:['x2']},
  {id:'s4',proj:'A',org:'sa',item:'연구활동비',sub:'국내여비',date:'2026-12-03',title:'가온소재 파일럿 라인 방문',amount:380000,status:'예정',att:['p1','p2']},
  {id:'s5',proj:'A',org:'sa',item:'연구활동비',sub:'야근·특근 식대',date:'2026-11-02',title:'바인더 시험 야간 측정',amount:90000,status:'예정',att:['p3']},
  {id:'s6',proj:'B',org:'sa',item:'연구활동비',sub:'국내여비',date:'2026-11-20',title:'참여 공장 B 현장 점검',amount:240000,status:'예정',att:['p9']},
  {id:'s7',proj:'B',org:'sa',item:'연구활동비',sub:'야근·특근 식대',date:'2026-11-26',title:'야간 교대 이미지 수집',amount:60000,status:'예정',att:['p2','p9']},
];
Object.defineProperty(S,'salary',{get(){return S.pay[S.payYear]||(S.pay[S.payYear]={})}});
S.projects.forEach(p=>{if(!p.short||/^연구[A-Z]$/.test(p.short))p.short=shortName(p.name)});
S.projects.forEach(p=>{if(p.consortium===undefined)p.consortium=p.parts.length>1});
S.propYr=0;
[['A','PM: 김서윤 / 참여: 박도현, 이하린, 정다은'],['B','PM: 김서윤 / 참여: 오지민'],['D','총괄: 새솔대 / 1세부: 가온소재']].forEach(([id,v])=>{const p=S.projects.find(x=>x.id===id);if(p)p.wrMem=v});S.projects.forEach(p=>{if(!p.kind)p.kind='연구'});
S.teamF='all';S.openTabs=null;
S.pay[2027]=Object.fromEntries(Object.entries(S.pay[2026]).map(([k,v])=>[k,Math.round(v*1.03/10000)*10000]));
S.pay[2025]=Object.fromEntries(Object.entries(S.pay[2026]).map(([k,v])=>[k,Math.round(v/1.03/10000)*10000]));
(()=>{const G26={sa:[['연구원',2800000],['선임연구원',3600000],['책임연구원(과장급)',4300000],['팀장',5000000],['본부장',6000000],['단장',6800000]],ga:[['사원',2700000],['대리',3300000],['과장',4000000],['차장',4700000],['부장',5500000]]};
  Object.entries(G26).forEach(([org,rows])=>{S.grades[org]={};[[2025,1/1.03],[2026,1],[2027,1.03]].forEach(([y,k])=>{S.grades[org][y]=rows.map(([n,t],i)=>({no:i+1,name:n,tax:Math.round(t*k/10000)*10000,free:200000}))})});
  const PG={p4:3,p13:5,p12:6,p9:2,p6:2};[2025,2026,2027].forEach(y=>{S.pgrade[y]={...PG}});
  [2025,2026,2027].forEach(y=>{['p1','p2'].forEach(id=>{S.payFree[y][id]=200000})})})();
S.people.forEach(x=>{x.login=x.login||LOGIN[x.id]||x.id;x.acct=x.acct||(x.id==='p10'?'초대됨':'활성');if(/대학원생|학부/.test(x.role)){x.noIns=true;x.noRet=true}});
S.entries=[
  mkEntry({id:1,proj:'A',org:'sa',item:'인건비',sub:'내부인건비',date:'2026-10-25',desc:'10월 참여연구원 인건비',vendor:'-',amount:26000000}),
  mkEntry({id:2,proj:'A',org:'sa',item:'학생인건비',sub:'일반(통합관리기관 아님)',date:'2026-10-25',desc:'10월 학생연구원 인건비',vendor:'-',amount:6000000},['학생연구자 연구참여확약서']),
  mkEntry({id:3,proj:'A',org:'sa',item:'연구활동비',sub:'회의비',date:'2026-10-20',desc:'2차년도 착수 회의 식대',vendor:'한솥가든',amount:320000,meeting:'m1'}),
  mkEntry({id:4,proj:'A',org:'sa',item:'연구활동비',sub:'국내여비',date:'2026-10-28',desc:'가온소재 공장 방문 출장',vendor:'코레일',amount:410000,att:['p1','p2']},['출장신청서']),
  mkEntry({id:5,proj:'A',org:'sa',item:'연구재료비',sub:'구매',date:'2026-10-14',desc:'분리막 코팅용 시약',vendor:'케미랩',amount:8400000},[CHK]),
  mkEntry({id:6,proj:'A',org:'sa',item:'연구시설·장비비',sub:'구매',date:'2026-10-09',desc:'코팅 두께 측정기',vendor:'정밀계측',amount:18500000},['i-Tube 등록 확인서']),
  mkEntry({id:7,proj:'A',org:'sa',item:'연구활동비',sub:'전문가활용비',date:'2026-10-30',desc:'열안정성 자문 (오세준)',vendor:'-',amount:300000,exp:['x1']},['내부결재문서(전문가 인적사항)']),
  mkEntry({id:8,proj:'A',org:'sa',item:'간접비',sub:'비영리기관',date:'2026-10-31',desc:'10월 간접비',vendor:'-',amount:9000000}),
  mkEntry({id:9,proj:'A',org:'ga',item:'인건비',sub:'내부인건비',date:'2026-10-25',desc:'10월 참여연구원 인건비 (현물)',vendor:'-',amount:11000000,fund:'현물'},['건강보험자격득실확인서']),
  mkEntry({id:10,proj:'A',org:'ga',item:'연구재료비',sub:'구매',date:'2026-10-19',desc:'세라믹 코팅 원료',vendor:'세라원',amount:6200000}),
  mkEntry({id:11,proj:'B',org:'sa',item:'인건비',sub:'내부인건비',date:'2026-10-25',desc:'10월 인건비',vendor:'-',amount:4300000}),
  mkEntry({id:12,proj:'B',org:'sa',item:'연구시설·장비비',sub:'구매',date:'2026-06-11',desc:'산업용 카메라 2대',vendor:'비전테크',amount:6500000}),
  mkEntry({id:13,proj:'B',org:'sa',item:'연구활동비',sub:'소프트웨어활용비',date:'2026-07-02',desc:'이미지 라벨링 SW 1년',vendor:'라벨온',amount:2400000},[CHK,'내부결재문서']),
  mkEntry({id:14,proj:'B',org:'sa',item:'연구활동비',sub:'회의비',date:'2026-07-15',desc:'중간 점검 회의 식대',vendor:'바른식당',amount:85000}),
  mkEntry({id:15,proj:'C',org:'sa',item:'인건비',sub:'내부인건비',date:'2026-02-25',desc:'2월 참여연구원 인건비',vendor:'-',amount:5200000}),
  mkEntry({id:16,proj:'C',org:'sa',item:'연구활동비',sub:'회의비',date:'2026-02-24',desc:'최종 성과 점검 회의 식대',vendor:'한솥가든',amount:120000,meeting:'mc1'}),
  mkEntry({id:18,proj:'A',org:'sa',item:'인건비',sub:'내부인건비',date:'2026-08-25',desc:'8월 참여연구원 인건비',vendor:'-',amount:24500000}),
  mkEntry({id:19,proj:'A',org:'sa',item:'연구활동비',sub:'회의비',date:'2026-03-12',desc:'1차년도 중간 점검 회의 식대',vendor:'바른식당',amount:260000}),
  mkEntry({id:20,proj:'A',org:'sa',item:'연구재료비',sub:'구매',date:'2026-01-20',desc:'분리막 기재 필름',vendor:'케미랩',amount:5100000}),
  mkEntry({id:21,proj:'C',org:'sa',item:'인건비',sub:'내부인건비',date:'2024-11-25',desc:'11월 참여연구원 인건비',vendor:'-',amount:4800000}),
  mkEntry({id:17,proj:'C',org:'sa',item:'연구활동비',sub:'소프트웨어활용비',date:'2025-09-03',desc:'공정 데이터 수집 SW',vendor:'데이터웍스',amount:3300000}),
];
S.made['3|회의록']={docId:'d5'};S.made['16|회의록']={docId:'d9'};
S.receipts=[
  {id:'r1',date:'2026-10-28',time:'12:10',vendor:'바른식당',amount:96000,card:'법인카드 ****-1234',lines:[['점심 정식 4인',96000]],by:'p2',st:'new'},
  {id:'r2',date:'2026-11-03',time:'08:42',vendor:'코레일 KTX',amount:59800,card:'법인카드 ****-1234',lines:[['서울→대전 2매',59800]],by:'p3',st:'new'},
  {id:'r3',date:'2026-11-06',time:'15:20',vendor:'케미랩',amount:1320000,card:'연구비카드 ****-7788',lines:[['PVDF 바인더 500g',880000],['NMP 용매 1L',440000]],by:'p2',st:'new'},
];
S.receipts.forEach(r=>r.img=receiptImage(r));
S.TPL=JSON.parse(JSON.stringify(TPL_DEFAULT));
seedPerf();
S.experts.forEach(x=>{x.xo=x.xo||'sa';x.share=x.share||'org'});(()=>{const a=expert('x5'),b=expert('x7');if(a&&!a.by){a.share='unit';a.by='p1';a.unit='스마트소재연구실'}if(b&&!b.by){b.share='me';b.by='p1';b.unit='스마트소재연구실'}})();
S.collect.push({id:'cp1',proj:'D',kind:'prop',title:'세부과제별 제안서 작성 양식',due:'2026-11-20',tpl:'제안서_세부과제_작성양식.hwp',by:'sa',subs:{sa:{name:'새솔대_제안서_총괄.hwp',date:'2026-11-05',by:'p1'}}});
(function seedGantt(){const A=S.projects.find(p=>p.id==='A');if(!A||A.tasks)return;const o2='ga';
  A.tasks=[{id:uid(),org:'sa',title:'연구 총괄 및 성과관리',s:'2026-10',e:'2027-09',prog:15},{id:uid(),org:'sa',title:'세라믹 코팅 조성 최적화',s:'2026-10',e:'2027-03',prog:20},{id:uid(),org:'sa',title:'열수축·접착력 평가',s:'2027-02',e:'2027-08',prog:0},
    {id:uid(),org:o2,title:'파일럿 라인 코팅 속도 향상',s:'2026-10',e:'2027-02',prog:10},{id:uid(),org:o2,title:'셀 단위 안전성 평가',s:'2027-01',e:'2027-09',prog:0},
    {id:uid(),org:'sa',title:'세라믹 입자 분산 기술',s:'2025-10',e:'2026-05',prog:100},{id:uid(),org:o2,title:'시제품 코팅 라인 구축',s:'2026-01',e:'2026-09',prog:100}];
  A.miles=[{id:uid(),ym:'2026-10',org:'sa',title:'2차년도 착수 회의',owner:'김서윤',st:'완료'},{id:uid(),ym:'2026-12',org:o2,title:'파일럿 라인 1차 시운전',owner:'',st:'진행'},{id:uid(),ym:'2027-03',org:'sa',title:'코팅 조성 확정 검토회',owner:'',st:'예정'},{id:uid(),ym:'2027-09',org:'sa',title:'연차 평가 및 결과보고서 제출',owner:'',st:'예정'},{id:uid(),ym:'2026-03',org:'sa',title:'분산 기술 중간 점검',owner:'',st:'완료'}];
  A.sMemo='12월 시운전 결과는 각 기관 12/20까지 공유';})();
seedPropYears();
seedAppr();migrateLines();
// 시연: 새솔대는 연구행정팀이 급여와 모든 과제 연구비를 볼 수 있게 열람 권한을 정해 뒀어요 (설정 → 열람 권한).
S.orgs.sa.acl={pay:{units:['연구행정팀']},research:{members:true,units:['연구행정팀']}};
}
