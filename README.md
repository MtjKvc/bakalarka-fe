# 🎓 ARCHITEKTURA POCITACOV - Školský Manažment Systém


Komplexná Angular aplikácia navrhnutá na zefektívnenie výučby a administratívy. Systém je rozdelený na dva hlavné moduly: **Študentský portál** a **Učiteľský panel**, pričom prístup je riadený na základe rolí (Role-Based Access Control).

---

## 🚀 Kľúčové Funkcionality

Aplikácia je rozdelená do dvoch hlavných sekcií podľa typu používateľa:

### 👨‍🎓 Sekcia pre Študentov
Prostredie navrhnuté pre prehľadnosť a sledovanie študijných povinností.
* **Prehľad úloh (Dashboard):** Zobrazenie aktuálnych, nadchádzajúcich zadaní.
* **Detail úlohy:** Možnosť prezerať zadania, sťahovať prílohy.


### 👩‍🏫 Sekcia pre Učiteľov
Administratívne rozhranie pre správu kurzu a hodnotenie.
* **Manažment úloh a cvičení:** Vytváranie nových zadaní, nastavovanie blokov.
* **Bodovanie a Hodnotenie:** Zapisovanie bodov za úlohy.
* **Evidencia dochádzky:** Digitálny záznam prítomnosti študentov na cvičeniach.
* **Správa študentov:** Prehľad zoznamu študentov a ich individuálneho progresu.

---

## 🛠 Použité Technológie

* **Frontend:** [Angular](https://angular.io/) (vLatest)
* **UI Knižnica:** (Tailwind CSS)
* **Autentifikácia:** JWT Interceptors & Auth Guards

---

## ⚙️ Inštalácia a Spustenie

Pre spustenie projektu na lokálnom stroji postupujte nasledovne:

1.  **Inštalácia závislostí:**
    ```bash
    npm install
    ```

2.  **Spustenie vývojového servera:**
    ```bash
    ng serve
    ```
    Aplikácia je dostupná na adrese `http://localhost:4200/`.

