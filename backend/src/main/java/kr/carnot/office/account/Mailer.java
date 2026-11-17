package kr.carnot.office.account;

import kr.carnot.office.common.CarnotProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/** 메일 보내기. 메일 서버(MAIL_HOST)를 설정하지 않으면 서버 로그에만 남겨요 (개발용). */
@Component
public class Mailer {
    private static final Logger log = LoggerFactory.getLogger(Mailer.class);
    private final ObjectProvider<JavaMailSender> sender;
    private final CarnotProperties props;
    private final String host;

    public Mailer(ObjectProvider<JavaMailSender> sender, CarnotProperties props, org.springframework.core.env.Environment env) {
        this.sender = sender;
        this.props = props;
        this.host = env.getProperty("spring.mail.host", "");
    }

    public boolean configured() {
        return !host.isBlank() && sender.getIfAvailable() != null;
    }

    public void send(String to, String subject, String body) {
        if (!configured()) {
            log.info("[메일 미설정] to={} subject={}\n{}", to, subject, body);
            return;
        }
        try {
            var m = new SimpleMailMessage();
            m.setFrom(props.mailFrom());
            m.setTo(to);
            m.setSubject(subject);
            m.setText(body);
            sender.getObject().send(m);
        } catch (Exception e) {
            log.warn("메일을 보내지 못했어요: {}", e.getMessage());
        }
    }
}
