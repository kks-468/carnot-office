// 앱 상태(S)가 아직 느슨한 타입이라 Object.entries/values 결과도 any로 다뤄요.
interface ObjectConstructor {
  entries(o: any): [string, any][];
  values(o: any): any[];
}
