# 開發日誌 (Development Log)

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
