package com.trustintern.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI trustInternOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("TrustIntern AI REST API")
                        .description("API documentation for the TrustIntern AI backend. Includes authentication, student/recruiter/admin endpoints, and verification workflows.")
                        .version("1.0.0")
                        .contact(new Contact().name("TrustIntern AI Team").email("support@trustintern.ai"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .externalDocs(new ExternalDocumentation()
                        .description("Project README")
                        .url("https://github.com/trustintern-ai"));
    }
}
