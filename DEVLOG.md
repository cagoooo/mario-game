# 開發日誌 (Development Log)

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
