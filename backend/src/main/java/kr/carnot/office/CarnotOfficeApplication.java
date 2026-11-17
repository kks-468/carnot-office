package kr.carnot.office;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** Carnot office 백엔드 진입점. */
@SpringBootApplication
@ConfigurationPropertiesScan
public class CarnotOfficeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CarnotOfficeApplication.class, args);
    }
}
