package com.dnd.controller;

import com.dnd.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    private final MapService mapService;

    @Autowired
    public ViewController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping("/gm")
    public String index(Model model) {
        model.addAttribute("maps", mapService.getAllMaps());
        return "index";
    }

    @GetMapping("/view")
    public String podglad(Model model) {
        model.addAttribute("maps", mapService.getAllMaps());
        return "podglad";
    }
}
