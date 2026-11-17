package kr.carnot.office.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yml의 carnot.* 설정. */
@ConfigurationProperties(prefix = "carnot")
public record CarnotProperties(Demo demo, String mailFrom, Ai ai, long maxSyncBytes) {
    public record Demo(boolean enabled, String password) {}

    public record Ai(String apiKey, String model, String modelQuick) {
        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
