package kr.carnot.office.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** 회사 주소(/saesol 같은 경로)로 들어와도 화면(index.html)을 내보내요. */
@Controller
public class SpaController {
    @GetMapping("/{code:[a-z0-9]{3,20}}")
    public String company() {
        return "forward:/index.html";
    }
}
