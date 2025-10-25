package com.dnd.model;

import java.util.ArrayList;
import java.util.List;

public class CharacterData {
    private Characters characters;
    private int enemyLetterCounter;
    private String playerColor;
    private String enemyColor;

    public CharacterData() {
        this.characters = new Characters();
        this.enemyLetterCounter = 0;
        this.playerColor = "#00ff00";
        this.enemyColor = "#ff0000";
    }

    public static class Characters {
        private List<Character> players = new ArrayList<>();
        private List<Enemy> enemies = new ArrayList<>();

        public List<Character> getPlayers() {
            return players;
        }

        public void setPlayers(List<Character> players) {
            this.players = players;
        }

        public List<Enemy> getEnemies() {
            return enemies;
        }

        public void setEnemies(List<Enemy> enemies) {
            this.enemies = enemies;
        }
    }

    public static class Character {
        private double x;
        private double y;

        public Character() {}

        public Character(double x, double y) {
            this.x = x;
            this.y = y;
        }

        public double getX() {
            return x;
        }

        public void setX(double x) {
            this.x = x;
        }

        public double getY() {
            return y;
        }

        public void setY(double y) {
            this.y = y;
        }
    }

    public static class Enemy extends Character {
        private String letter;

        public Enemy() {}

        public Enemy(double x, double y, String letter) {
            super(x, y);
            this.letter = letter;
        }

        public String getLetter() {
            return letter;
        }

        public void setLetter(String letter) {
            this.letter = letter;
        }
    }

    public Characters getCharacters() {
        return characters;
    }

    public void setCharacters(Characters characters) {
        this.characters = characters;
    }

    public int getEnemyLetterCounter() {
        return enemyLetterCounter;
    }

    public void setEnemyLetterCounter(int enemyLetterCounter) {
        this.enemyLetterCounter = enemyLetterCounter;
    }

    public String getPlayerColor() {
        return playerColor;
    }

    public void setPlayerColor(String playerColor) {
        this.playerColor = playerColor;
    }

    public String getEnemyColor() {
        return enemyColor;
    }

    public void setEnemyColor(String enemyColor) {
        this.enemyColor = enemyColor;
    }
}

