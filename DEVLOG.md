# 開發日誌 (Development Log)

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
