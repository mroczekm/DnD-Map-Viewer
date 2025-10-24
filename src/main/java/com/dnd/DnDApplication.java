package com.dnd;

import com.dnd.config.MapConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(MapConfiguration.class)
public class DnDApplication {

    public static void main(String[] args) {
        SpringApplication.run(DnDApplication.class, args);
    }

}
