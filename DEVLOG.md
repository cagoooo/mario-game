# 開發日誌 (Development Log)

## 2026-05-01 (v2.29.0)

### 🏅 成就系統內容擴充

v2.13 已做基礎 9 個成就，但沒有**展示頁**也沒有**動力推進**，玩家拿到成就也只看到一個短暫通知就消失。本版補滿這兩塊。

**新增 10 個成就（總計 19）：**

| 類別 | 成就 | 條件 | 隱藏 |
|---|---|---|---|
| Combat | Boss 大師 | 擊敗 5 隻 Boss | ✅ |
| Combat | 連跳王 | 連踩 10 隻敵人 | ✅ |
| Coins | 連續豐收 | 1 秒內收集 10 枚金幣 | ✅ |
| Skills | 變身達人 | 累計取得 10 個道具 | – |
| Skills | 冰凍大師 | 凍結 30 隻敵人 | – |
| Skills | 空中飛人 | 披風滑翔累計 10 秒 | – |
| Score | 五千分大師 | 單次 ≥ 5,000 分 | – |
| Score | 萬分傳奇 | 單次 ≥ 10,000 分 | ✅ |
| Worlds | 初次通關 | 通關任一 World | – |
| Worlds | 征服四方 | 通關全部 4 World | ✅ |
| Worlds | 完美通關 | 一條命通關 | ✅ |

**隱藏成就機制：**
- `ACHIEVEMENTS[*].hidden = true` 屬性
- 未解鎖時 `getAllAchievements()` 自動把 name/desc/icon 替換成 `???` / `🔒`
- 解鎖後一切正常顯示

**新追蹤維度：**
- `frozenEnemies`（冰球凍敵 → Game.js iceball collision）
- `glideFrames`（披風滑翔每幀 → Player.js gravity branch）
- `powerUpsCollected`（道具拾取 → 整合進 firstTimePickupHint）
- `worldsCleared` / `noDeathRuns`（Boss 通關 → handleBossDefeat）
- `maxCoinRush`（1 秒內金幣 sliding window → trackCoinCollect）

**成就展示頁 Modal：**
- 暫停選單新增「🏅 成就 (5/19)」按鈕（即時顯示解鎖率）
- Modal 列出全部成就 — 已解鎖金邊+陰影、未解鎖灰底
- 響應式（手機字體縮小 + 高度限制）
- 重用既存 `.modal-overlay` 樣式 + 新加 `#achievementsList` 滾動容器

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/AchievementSystem.js` | ✏️ 擴充（19 個成就 + 新 trackers + hidden 機制） |
| `js/Game.js` | ✏️ firstTimePickupHint 加 trackPowerUp、iceball 加 trackFreeze、handleBossDefeat 加 trackWorldClear、loseLife 設 _diedThisRun、initGame 重置 |
| `js/Player.js` | ✏️ glide 分支加 trackGlideFrame |
| `index.html` | ✏️ 暫停按鈕 + Achievements Modal |
| `style.css` | ✏️ Achievements Modal 樣式 |
| `js/main.js` | ✏️ wire up Modal（render、open、close） |
| `js/version.js` / `sw.js` / `version.json` | ✏️ bump-version.js 同步 |

---

## 2026-05-01 (v2.28.0)

### 📖 教學引導重做

把舊的「每次開遊戲都被迫看 cutscene」改成「版本綁定 + 道具情境提示」，並補齊 v2.13 ~ v2.17 累積的新技能說明。

**動機：**
v2.13 加成就、v2.14 加 Sprint、v2.15 加 Wall Jump、v2.17 加 Cape — 但 Tutorial.js 的步驟還停在最早期，新玩家根本不會發現這些技能存在。同時老玩家每次開遊戲都被迫看 cutscene，累積煩躁。

**設計：版本綁定（取捨選 c）**
- `Tutorial.js` 內 `TUTORIAL_VERSION` 常數，complete 時寫進 `localStorage.marioTutorialSeenVersion`
- 啟動時若版本不符 → 自動重播一次新內容（補課完就再也不打擾）
- 老玩家的舊紀錄會被識別為「未看過 v2.28.0 教學」→ 補課新增的步驟

**擴充步驟（6 → 8 步）：**
1. 歡迎
2. 移動 + 跳躍（合併）
3. 踩敵人（強調連踩加分）
4. **Shift 衝刺** ⭐ 新增
5. **↓ 蹲下 / 牆壁+跳 蹬牆跳** ⭐ 新增
6. 金幣 / 問號磚塊
7. **披風滑翔 / 火冰花射子彈** ⭐ 新增
8. 準備開始

**情境提示（道具首次拾取）：**
- 新增 `game.firstTimePickupHint(type, text)` API — 用 `localStorage.marioPowerUpSeen_<type>` 紀錄首次
- 在 CollisionSystem 各 power-up 拾取點呼叫：
  - 🍄 Mushroom：「變大！受到傷害會回到小狀態」
  - ⭐ Star：「無敵！短時間內碰到敵人會直接消滅他們」
  - 🔥 Fire Flower：「按空白鍵發射火球攻擊敵人」
  - ❄️ Ice Flower：「冰球能凍住敵人，被凍敵人可當踏腳石」
  - 🧲 Magnet：「自動吸附附近金幣」
  - 🍄💥 Mega Mushroom：「巨大化！可破壞敵人、磚塊、水管」
  - 🦸 Cape：「空中按住空白鍵減緩下降」
- 沿用 v2.24.0 已存在的 `showPowerUpHint()` UI（3 秒淡出）

**「重看教學」入口：**
- 暫停選單新增 `📖 重看教學` 按鈕（pauseSecondaryBtn 樣式）
- 點下去 = 清除 flag + dynamic import Tutorial.js + 立即在當前遊戲中重播

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/Tutorial.js` | ✏️ 重寫（版本綁定 + 8 步驟）+ 匯出 resetTutorial() |
| `js/Game.js` | ✏️ 新增 firstTimePickupHint() helper |
| `js/CollisionSystem.js` | ✏️ 7 個 power-up 拾取點接入 hint |
| `index.html` | ✏️ 暫停選單 pauseActions + replayTutorialButton |
| `style.css` | ✏️ pauseSecondaryBtn 樣式 |
| `js/main.js` | ✏️ wire up replayTutorialButton |
| `js/version.js` / `sw.js` / `version.json` | ✏️ 由 `bump-version.js` 自動同步 |

### 🛠️ 首次正式使用 bump-version.js

```bash
node scripts/bump-version.js 2.28.0 "教學引導重做：版本綁定 + 擴充步驟 + 道具首次提示"
# → 自動同步 js/version.js / sw.js / version.json / index.html 4 處
```

驗證腳本工作正常 — 拒絕 same-version bump、明確列出哪些檔案有更新。

---

## 2026-05-01 (v2.27.1)

### 🔄 PWA 自動更新偵測機制

套用 `pwa-cache-bust` skill 的最佳實踐，徹底解決「改了沒看到」問題。下次開始 v2.28.0 之後，玩家無須清快取就能自動拿到新版。

**動機（剛踩到的真實雷）：**
v2.27.0 部署後玩家 console 顯示混合版本「Game Version: 2.26.0 (Level Select + 4 Worlds)」— 新 main.js + 舊 version.js 同時被舊 SW cache 服務，造成 DOM 缺失與 null crash。

**新策略：**
1. **SW 分策略快取** — `sw.js` 重寫
   - HTML / version.json：network-first（永遠抓最新入口）
   - `?v=X.Y.Z` 版本化資源：cache-first（URL 帶版本自然當不同 key）
   - JSON / 圖片：cache-first with network fallback
2. **`version.json`** — 新建在根目錄，前端輪詢入口
3. **更新 Banner** — 偵測到新版後 slide-up 提示，按「立即更新」呼叫 `SKIP_WAITING` + reload
4. **雙重訊號**：
   - SW `updatefound` event → 派發 `marioNewVersionReady` CustomEvent
   - main.js 每 5 分鐘 polling `version.json?t=` (cache: no-store)
5. **`scripts/bump-version.js`** — 一鍵同步 4 處版本號（version.js / sw.js / version.json / index.html）

**Defensive code：** main.js 對 level-select DOM 加了 null check + warning，舊 HTML 不會再 crash 新 JS。

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `sw.js` | ✏️ 重寫（strategy split） |
| `version.json` | 🆕 新增 |
| `index.html` | ✏️ SW register + update banner DOM + ?v=2.27.1 |
| `style.css` | ✏️ 加 update banner 樣式 |
| `js/main.js` | ✏️ version.json 輪詢 + banner 控制 + defensive null check |
| `js/version.js` | ✏️ 2.27.0 → 2.27.1 |
| `scripts/bump-version.js` | 🆕 新增（一鍵升版工具） |

### 🔧 升版工作流程（v2.27.1 起的鐵則）

```bash
# 自動 patch bump (2.27.1 → 2.27.2)
node scripts/bump-version.js

# minor / major
node scripts/bump-version.js minor "新增 Boss 多階段"
node scripts/bump-version.js 2.30.0 "Build pipeline 重構"

git diff      # review
git commit -am "v2.27.2: ..."
git push      # 客戶端 5 分鐘內自動偵測，跳更新 banner
```

### ⚠️ 關鍵理解

**舊 cache 的玩家「最後一次手動清」之後**，未來改版完全不需要再請玩家清快取 — banner 會自動跳出來。

---

## 2026-05-01 (v2.27.0)

### 🎮 關卡選擇系統 + 4 個世界

新玩家流程改成：開始遊戲 → NES 風格選單（World 1-1 ~ 1-4 / Endless Mode）→ 進入關卡。打贏第一隻 Boss 即解鎖下一關，進度寫入 localStorage 持久化。

**設計取捨：**
- MVP 不動 streaming chunk 架構，關卡 = 鎖定 biome + 顯示名稱
- World 1-1 PLAINS 草原 ／ 1-2 DESERT 沙漠 ／ 1-3 SNOW 雪地 ／ 1-4 SPOOKY 鬼屋
- Endless Mode 保留為獨立入口（biome 隨機，原本行為）
- 真正的 JSON-loaded 固定關卡推遲到 v3.0 build pipeline 之後做

**新增能力：**
- `js/Levels.js` — LEVELS 常數 + `getUnlockedLevels` / `unlockLevel` / `getNextLevelId`
- `Game` constructor 新增第 4 參數 `levelConfig`，`levelMode` 為 true 時 `currentBiome` 從隨機改成鎖定
- `handleBossDefeat` 在 level mode 不再持續刷 boss，改為 dispatch `marioLevelCleared` event
- `levelClearedOverlay` UI（NES 黃字 + STAGE CLEAR 跳動）
- 鍵盤導航 ↑↓ Enter Esc，觸控直接點卡片

### 📁 新增/修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/Levels.js` | 🆕 新增 |
| `js/Game.js` | ✏️ levelConfig / levelMode / 通關 event |
| `js/main.js` | ✏️ 關卡選擇流程接管 |
| `index.html` | ✏️ 關卡選擇 + 通關 overlay DOM |
| `style.css` | ✏️ NES retro menu 樣式 |

---

## 2026-05-01 (v2.26.0)

### 🧹 技術債三連發

清理過去 13 版累積下來的快取機制腐朽 — 全程不影響玩家可見行為，但讓 PWA 真正能跑起來、未來改版不再每次手改 import 版本字串。

**起因（已發現的隱藏 bug）：**
- Game.js 等 13 個檔散落 `?v=1.6.22` ~ `?v=2.25.0` 共 13 種版本字串，許多版本根本不對應任何實際發版
- sw.js 的 `urlsToCache` 寫了 3 個錯誤路徑：
  - `./css/style.css` — 該資料夾根本不存在（實際在根目錄）
  - `./icon-192.png` — 該檔案在 `./assets/` 底下
  - `./icon-512.png` — 檔案不存在
  - 漏掉 `./js/Platform.js`（被 LevelLoader / LevelGenerator import）
- `cache.addAll()` 是原子操作，只要一個 fail 整批 fail — 等於 PWA 從未成功 install
- index.html line 105 ~ 112 又把 SW 自動 unregister，所以這個 bug 從來沒被注意到

**變更內容：**
- 🆕 建立 `js/version.js` — `export const GAME_VERSION = '2.26.0'`，作為單一版本號真相
- ✏️ 移除 11 個 JS 檔的 import `?v=X.Y.Z` 字串（共 80+ 處）
  - 動機：ES 靜態 import 不能用模板字串；繼續硬編版本只會持續腐爛
  - 改由 SW `CACHE_NAME` 與 index.html 的 `style.css?v=` / `main.js?v=` 兩個入口統一管控
- ✏️ sw.js：修正 3 個錯誤路徑 + 補上漏掉的檔案 + `CACHE_NAME` 升至 `mario-game-v2.26.0`
- ✏️ index.html：`style.css?v=2.25.0` 與 `main.js?v=2.25.0` → `2.26.0`
- 🗑️ 刪除過期的 `docs/optimization_roadmap_v2.8.0.md`（內容多已實作完，殘餘項目已併入 task.md）

**未處理（記錄於 task.md 技術債清單）：**
- index.html 的 SW unregister hack 還在 — 真正部署時 PWA 還是不會生效，等下次穩定版再決定怎麼處理
- sw.js cache list 仍需手動維護 — 待 v2.30.0 build pipeline 解

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/version.js` | 🆕 新增 |
| `js/Game.js` | ✏️ 修改（移除 35 個版本字串） |
| `js/CollisionSystem.js` | ✏️ 修改（移除 10 個） |
| `js/EnemyManager.js` | ✏️ 修改 |
| `js/main.js` | ✏️ 修改 |
| `js/Boss.js` | ✏️ 修改 |
| `js/LevelLoader.js` | ✏️ 修改 |
| `js/LevelGenerator.js` | ✏️ 修改 |
| `js/ParticleSystem.js` | ✏️ 修改 |
| `js/Player.js` | ✏️ 修改 |
| `js/TransitionManager.js` | ✏️ 修改 |
| `js/UIManager.js` | ✏️ 修改 |
| `sw.js` | ✏️ 重寫 |
| `index.html` | ✏️ 修改 |
| `task.md` | ✏️ 大幅更新（新增第十四階段 + 階段重編號） |
| `docs/optimization_roadmap_v2.8.0.md` | 🗑️ 刪除 |

### 🔧 鐵則（v2.26.0 起）

> **改版時 `js/version.js` 的 `GAME_VERSION` 與 `sw.js` 的 `CACHE_NAME` 必須同步。**
> 這兩個是僅剩的版本號真相 — 之後就只改這兩處。

---

## 2026-04-01 (v2.25.0)

### 📱 開放直立畫面遊玩

移除了強制橫向限制，讓玩家在手機直立模式下也能遊玩，大幅提升行動端易用性。

**變更內容：**
- 移除 `checkOrientation()` 中偵測直立並顯示全螢幕封鎖遮罩的邏輯
- 直立模式下 `#gameArea` canvas 限縮為 `45svh`，為觸控按鈕留出空間
- 橫向模式恢復 `100svh` 以充分利用螢幕
- 觸控按鈕改為在所有觸控裝置（包含直立與橫向）均顯示
- 直立模式下 `#gameUI` 字體與按鈕縮小以節省空間

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/main.js` | ✏️ 修改 |
| `style.css` | ✏️ 修改 |

---

## 2025-12-20 (v2.18.0)

### 🚀 效能優化：空間分割碰撞檢測

將已存在的 `SpatialGrid.js` 整合至 `CollisionSystem.js`，使所有碰撞檢測從 O(N) 降為 O(1) 平均複雜度。

**優化範圍：**
- 敵人碰撞 (`handleEnemyCollisions`)
- 問號磚塊 (`handleBlockCollisions`)
- 平台碰撞 (`handlePlatformCollisions`)
- 金幣收集 (`handleItemCollisions`)
- 水管碰撞 (`handleEnvironmentCollisions`)

### 📁 修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/CollisionSystem.js` | ✏️ 修改 |
| `js/main.js` | ✏️ 修改 |

---

## 2025-12-19 (v2.17.0 ~ v2.17.4)

### 🎯 本次更新重點

1. **披風道具 (Cape Power-up)** - `js/Cape.js`
   - 5% 機率從問號磚塊掉落
   - 空中按住 Space 可滑翔 (gravity 0.1)

2. **存檔系統增強** - `js/Game.js`
   - `game.saveProgress()` - 儲存進度
   - `game.loadProgress()` - 載入進度
   - `game.clearProgress()` - 清除進度

3. **效能優化**
   - 粒子上限: 150
   - 天氣粒子: 200→100
   - 物件清理: 7→15 種類型

4. **星星無敵強化**
   - 速度: 6.0→7.5
   - BGM: 180→200 BPM

5. **iOS Safari 橫向修復**
   - 使用 `svh` (smallest viewport height)
   - 85svh max-height 限制

### 📁 新增/修改檔案

| 檔案 | 狀態 |
|------|------|
| `js/Cape.js` | 🆕 新增 |
| `js/Player.js` | ✏️ 修改 |
| `js/Game.js` | ✏️ 修改 |
| `js/CollisionSystem.js` | ✏️ 修改 |
| `js/QuestionBlock.js` | ✏️ 修改 |
| `js/WeatherSystem.js` | ✏️ 修改 |
| `js/ParticleSystem.js` | ✏️ 修改 |
| `js/AudioSystem.js` | ✏️ 修改 |
| `style.css` | ✏️ 修改 |

### 🔧 技術筆記

```css
/* iOS Safari 最佳 viewport 設定 */
@media (pointer: coarse) and (orientation: landscape) {
    #gameArea {
        max-height: 85svh;
    }
}
```

```javascript
// 存檔 API
game.saveProgress(); // 儲存
const progress = game.loadProgress(); // 載入
game.applyProgress(progress); // 套用
game.clearProgress(); // 清除
```

---

## 未來待辦

- [ ] 關卡選擇 UI
- [ ] 披風動畫效果
- [ ] 成就系統 UI
- [ ] 更多關卡設計
