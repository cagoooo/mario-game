export class EnhancedAudioSystem {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.isMuted = localStorage.getItem('marioMuted') === 'true';

        // BGM相關
        this.bgmNodes = [];
        this.currentBGMPattern = 0;
        this.bgmTempo = 120; // BPM
        this.bgmInterval = null;

        // 音效預設
        this.soundPresets = this.initSoundPresets();

        this.initAudio();
        this.loadVolumeSettings();
    }

    initAudio() {
        if (this.audioCtx) {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            return;
        }

        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // 創建音量控制節點
            this.masterGain = this.audioCtx.createGain();
            this.sfxGain = this.audioCtx.createGain();
            this.musicGain = this.audioCtx.createGain();

            // 連接音量節點
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioCtx.destination);

            // 設定初始音量
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
            this.sfxGain.gain.value = 0.7;
            this.musicGain.gain.value = 0.4;

        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }
    }

    // ========== 音量控制 ==========

    /**
     * 設定音效音量 (SFX)
     * @param {number} volume - 0.0 到 1.0
     */
    setSFXVolume(volume) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
            localStorage.setItem('marioSFXVolume', volume.toString());
        }
    }

    /**
     * 設定音樂音量 (BGM)
     * @param {number} volume - 0.0 到 1.0
     */
    setMusicVolume(volume) {
        if (this.musicGain) {
            this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
            localStorage.setItem('marioMusicVolume', volume.toString());
        }
    }

    /**
     * 取得音效音量
     * @returns {number}
     */
    getSFXVolume() {
        return this.sfxGain ? this.sfxGain.gain.value : 0.7;
    }

    /**
     * 取得音樂音量
     * @returns {number}
     */
    getMusicVolume() {
        return this.musicGain ? this.musicGain.gain.value : 0.4;
    }

    /**
     * 載入儲存的音量設定
     */
    loadVolumeSettings() {
        try {
            const sfxVol = localStorage.getItem('marioSFXVolume');
            const musicVol = localStorage.getItem('marioMusicVolume');
            if (sfxVol !== null) this.setSFXVolume(parseFloat(sfxVol));
            if (musicVol !== null) this.setMusicVolume(parseFloat(musicVol));
        } catch (e) {
            console.warn('Could not load volume settings');
        }
    }

    initSoundPresets() {
        return {
            // 跳躍音效 - 經典Mario跳躍聲
            jump: {
                type: 'square',
                frequencies: [330, 523, 659],
                durations: [0.1, 0.1, 0.15],
                volumes: [0.3, 0.2, 0.1],
                attack: 0.01,
                decay: 0.1
            },

            // 雙重跳躍音效
            doubleJump: {
                type: 'square',
                frequencies: [440, 659, 880, 1047],
                durations: [0.08, 0.08, 0.08, 0.12],
                volumes: [0.25, 0.2, 0.15, 0.1],
                attack: 0.01,
                decay: 0.08
            },

            // 踩踏敵人音效
            stomp: {
                type: 'square',
                frequencies: [220, 165, 110],
                durations: [0.05, 0.05, 0.1],
                volumes: [0.4, 0.3, 0.2],
                attack: 0.01,
                decay: 0.05
            },

            // 收集金幣音效 - 經典叮噹聲
            coin: {
                type: 'square',
                frequencies: [988, 1319],
                durations: [0.1, 0.2],
                volumes: [0.3, 0.2],
                attack: 0.01,
                decay: 0.1
            },

            // 落地音效
            land: {
                type: 'sawtooth',
                frequencies: [150, 100],
                durations: [0.05, 0.1],
                volumes: [0.2, 0.1],
                attack: 0.01,
                decay: 0.05
            },

            // Power Down (Shrink/Lose Power)
            powerdown: {
                type: 'sawtooth',
                frequencies: [440, 330, 220, 110],
                durations: [0.1, 0.1, 0.1, 0.2],
                volumes: [0.3, 0.25, 0.2, 0.1],
                attack: 0.01,
                decay: 0.1
            },

            // 撞擊磚塊音效
            block: {
                type: 'square',
                frequencies: [440, 330, 220],
                durations: [0.05, 0.05, 0.1],
                volumes: [0.3, 0.25, 0.2],
                attack: 0.01,
                decay: 0.05
            },

            // 道具出現音效
            powerup: {
                type: 'square',
                frequencies: [523, 659, 784, 1047, 1319],
                durations: [0.1, 0.1, 0.1, 0.1, 0.2],
                volumes: [0.2, 0.2, 0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 火球發射音效
            fireball: {
                type: 'sawtooth',
                frequencies: [200, 300, 150],
                durations: [0.05, 0.1, 0.1],
                volumes: [0.3, 0.2, 0.1],
                attack: 0.01,
                decay: 0.05
            },

            // 冰球發射音效 - 高音清脆
            iceball: {
                type: 'sine',
                frequencies: [1200, 1600, 1000, 800],
                durations: [0.04, 0.05, 0.06, 0.08],
                volumes: [0.2, 0.22, 0.18, 0.12],
                attack: 0.01,
                decay: 0.03
            },

            // 死亡音效
            death: {
                type: 'square',
                frequencies: [523, 494, 466, 440, 415, 392, 370, 349],
                durations: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.3],
                volumes: [0.3, 0.28, 0.26, 0.24, 0.22, 0.2, 0.18, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 遊戲結束音效
            gameOver: {
                type: 'square',
                frequencies: [262, 247, 233, 220, 208, 196],
                durations: [0.2, 0.2, 0.2, 0.2, 0.2, 0.5],
                volumes: [0.3, 0.28, 0.26, 0.24, 0.22, 0.2],
                attack: 0.01,
                decay: 0.15
            },

            // 新紀錄音效
            newHighScore: {
                type: 'square',
                frequencies: [523, 659, 784, 1047, 1319, 1568, 1760],
                durations: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.3],
                volumes: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.2],
                attack: 0.01,
                decay: 0.1
            },

            // 星星道具音效
            star: {
                type: 'square',
                frequencies: [1047, 1319, 1568, 2093],
                durations: [0.1, 0.1, 0.1, 0.2],
                volumes: [0.2, 0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.08
            },

            // 變大蘑菇音效
            mushroom: {
                type: 'square',
                frequencies: [262, 330, 392, 523, 659],
                durations: [0.12, 0.12, 0.12, 0.12, 0.2],
                volumes: [0.2, 0.2, 0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 暫停音效
            pause: {
                type: 'square',
                frequencies: [440, 523],
                durations: [0.1, 0.2],
                volumes: [0.2, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 選單選擇音效
            menuSelect: {
                type: 'square',
                frequencies: [659, 784],
                durations: [0.05, 0.1],
                volumes: [0.2, 0.15],
                attack: 0.01,
                decay: 0.05
            },

            // 撞擊音效 (Bump)
            bump: {
                type: 'square',
                frequencies: [150, 50],
                durations: [0.05, 0.1],
                volumes: [0.2, 0.1],
                attack: 0.01,
                decay: 0.05
            },

            // 變小音效 (Shrink)
            shrink: {
                type: 'sawtooth',
                frequencies: [880, 440, 220],
                durations: [0.1, 0.1, 0.1],
                volumes: [0.3, 0.2, 0.1],
                attack: 0.01,
                decay: 0.1
            },

            // 蘑菇變身音效 (Powerup Mushroom) - 為了相容性
            powerup_mushroom: {
                type: 'square',
                frequencies: [440, 880, 1760],
                durations: [0.1, 0.1, 0.1],
                volumes: [0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 火焰花變身音效 (Powerup Fire)
            powerup_fire: {
                type: 'sawtooth',
                frequencies: [200, 600, 400],
                durations: [0.1, 0.1, 0.1],
                volumes: [0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.1
            },

            // 星星變身音效 (Powerup Star)
            powerup_star: {
                type: 'triangle',
                frequencies: [1000, 2000, 1000, 2000],
                durations: [0.1, 0.1, 0.1, 0.1],
                volumes: [0.2, 0.2, 0.2, 0.15],
                attack: 0.01,
                decay: 0.05
            },

            // 水管音效 (Pipe)
            pipe: {
                type: 'square',
                frequencies: [440, 392, 349, 330, 294, 262],
                durations: [0.05, 0.05, 0.05, 0.05, 0.05, 0.1],
                volumes: [0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
                attack: 0.01,
                decay: 0.05
            },

            // 踢擊音效 (Kick) - 用於踢龜殼等
            kick: {
                type: 'sawtooth',
                frequencies: [180, 120, 80],
                durations: [0.04, 0.06, 0.1],
                volumes: [0.35, 0.25, 0.15],
                attack: 0.01,
                decay: 0.03
            },

            // 存檔點音效 (Checkpoint)
            checkpoint: {
                type: 'triangle',
                frequencies: [523, 659, 784, 1047],
                durations: [0.15, 0.15, 0.15, 0.25],
                volumes: [0.25, 0.25, 0.25, 0.2],
                attack: 0.02,
                decay: 0.1
            },

            // 腳步聲 (Footstep) - 輕微的土地踩踏聲
            footstep: {
                type: 'sawtooth',
                frequencies: [80, 60],
                durations: [0.02, 0.03],
                volumes: [0.08, 0.05],
                attack: 0.01,
                decay: 0.02
            },

            // 成就解鎖音效 (Achievement)
            achievement: {
                type: 'square',
                frequencies: [659, 784, 988, 1319, 1568],
                durations: [0.1, 0.1, 0.1, 0.1, 0.3],
                volumes: [0.2, 0.22, 0.24, 0.25, 0.2],
                attack: 0.01,
                decay: 0.1
            },

            // Boss 出現音效
            bossAppear: {
                type: 'sawtooth',
                frequencies: [110, 130, 110, 82, 98, 82],
                durations: [0.2, 0.2, 0.2, 0.3, 0.3, 0.4],
                volumes: [0.3, 0.32, 0.3, 0.35, 0.35, 0.25],
                attack: 0.05,
                decay: 0.15
            },

            // 凍結音效 (Freeze) - 冰晶音效
            freeze: {
                type: 'triangle',
                frequencies: [2000, 1500, 2500, 1800, 2200],
                durations: [0.05, 0.05, 0.08, 0.08, 0.15],
                volumes: [0.2, 0.18, 0.22, 0.18, 0.15],
                attack: 0.01,
                decay: 0.05
            },

            // 冰球擊中音效 (Ice Hit)
            iceHit: {
                type: 'sine',
                frequencies: [1200, 800, 1600, 600],
                durations: [0.04, 0.06, 0.05, 0.1],
                volumes: [0.25, 0.2, 0.22, 0.15],
                attack: 0.01,
                decay: 0.04
            }
        };
    }

    // 播放音效
    playSound(type, pitch = 1, volume = 1) {
        if (!this.audioCtx || this.isMuted) return;

        const preset = this.soundPresets[type];
        if (!preset) {
            console.warn(`Sound preset '${type}' not found`);
            return;
        }

        try {
            this.audioCtx.resume();

            let currentTime = this.audioCtx.currentTime;

            preset.frequencies.forEach((freq, index) => {
                const oscillator = this.audioCtx.createOscillator();
                const gainNode = this.audioCtx.createGain();

                oscillator.type = preset.type;
                oscillator.frequency.setValueAtTime(freq * pitch, currentTime);

                // 音量包絡
                const vol = (preset.volumes[index] || 0.1) * volume;
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(vol, currentTime + preset.attack);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + preset.durations[index]);

                oscillator.connect(gainNode);
                gainNode.connect(this.sfxGain);

                oscillator.start(currentTime);
                oscillator.stop(currentTime + preset.durations[index]);

                currentTime += preset.durations[index] * 0.8; // 稍微重疊
            });

        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    /**
     * 播放音效並加入隨機變化 - 讓音效更生動自然
     * @param {string} type - 音效類型
     * @param {number} pitchVariation - 音高變化範圍 (預設 0.1 = ±10%)
     * @param {number} volumeVariation - 音量變化範圍 (預設 0.2 = ±20%)
     */
    playSoundWithVariation(type, pitchVariation = 0.1, volumeVariation = 0.2) {
        // 隨機音高變化: 1.0 ± pitchVariation
        const randomPitch = 1 + (Math.random() - 0.5) * 2 * pitchVariation;

        // 隨機音量變化: 1.0 ± volumeVariation
        const randomVolume = 1 + (Math.random() - 0.5) * 2 * volumeVariation;

        this.playSound(type, randomPitch, Math.max(0.3, randomVolume));
    }

    /**
     * 播放踩踏音效 - 隨機選擇變化
     */
    playStompVariation() {
        const variations = ['stomp', 'kick', 'bump'];
        const randomType = variations[Math.floor(Math.random() * variations.length)];
        this.playSoundWithVariation(randomType === 'stomp' ? 'stomp' : 'stomp', 0.15, 0.1);
    }

    /**
     * 播放金幣音效 - 帶音高變化
     */
    playCoinVariation() {
        // 每次收集金幣音高略有不同，避免重複感
        const pitchOffset = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
        this.playSound('coin', pitchOffset, 1);
    }

    setBGMTempo(bpm) {
        this.bgmTempo = bpm;
    }

    // 8-bit背景音樂模式
    startBGM(mode = 'normal') {
        if (this.isMuted || !this.audioCtx) return;

        // Resume context if suspended (Chrome policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(() => {
                this.startBGM(mode);
            }).catch(e => console.warn('Audio resume failed:', e));
            return;
        }

        try {
            this.stopBGM();

            const musicPattern = this.getMusicPattern(mode);
            this.currentBGMPattern = 0;

            // Set tempo
            if (musicPattern.tempo && this.bgmTempo !== musicPattern.tempo) {
                this.setBGMTempo(musicPattern.tempo);
            }

            this.bgmNodes = [];

            this.bgmInterval = setInterval(() => {
                if (!this.isMuted && this.audioCtx && this.audioCtx.state === 'running') {
                    this.playBGMNote(musicPattern);
                }
            }, (60 / this.bgmTempo) * 1000);

        } catch (e) {
            console.warn('BGM start failed:', e);
        }
    }

    getMusicPattern(mode) {
        const patterns = {
            // 平原 (PLAINS) - 輕快明亮
            PLAINS: {
                tempo: 150,
                melody: [
                    { note: 523, duration: 0.15 }, // C5
                    { note: 659, duration: 0.15 }, // E5
                    { note: 784, duration: 0.15 }, // G5
                    { note: 523, duration: 0.15 }, // C5
                    { note: 880, duration: 0.15 }, // A5
                    { note: 784, duration: 0.3 },  // G5
                    { note: 0, duration: 0.15 },   // Rest
                    { note: 659, duration: 0.15 }, // E5
                    { note: 523, duration: 0.15 }, // C5
                    { note: 0, duration: 0.15 },   // Rest
                ],
                bass: [
                    { note: 131, duration: 0.3 }, // C3
                    { note: 196, duration: 0.3 }, // G3
                    { note: 131, duration: 0.3 }, // C3
                    { note: 196, duration: 0.3 }, // G3
                    { note: 175, duration: 0.3 }, // F3
                    { note: 196, duration: 0.3 }, // G3
                ]
            },

            // 沙漠 (DESERT) - 神秘中東風
            DESERT: {
                tempo: 140,
                melody: [
                    { note: 523, duration: 0.2 }, // C5
                    { note: 554, duration: 0.2 }, // Db5
                    { note: 659, duration: 0.2 }, // E5
                    { note: 554, duration: 0.2 }, // Db5
                    { note: 523, duration: 0.2 }, // C5
                    { note: 494, duration: 0.2 }, // B4
                    { note: 523, duration: 0.4 }, // C5
                    { note: 0, duration: 0.2 },   // Rest
                ],
                bass: [
                    { note: 131, duration: 0.4 }, // C3
                    { note: 196, duration: 0.4 }, // G3
                    { note: 123, duration: 0.4 }, // B2
                    { note: 196, duration: 0.4 }, // G3
                ]
            },

            // 雪地 (SNOW) - 晶瑩剔透
            SNOW: {
                tempo: 130,
                melody: [
                    { note: 659, duration: 0.2 }, // E5
                    { note: 784, duration: 0.2 }, // G5
                    { note: 988, duration: 0.2 }, // B5
                    { note: 1175, duration: 0.4 }, // D6
                    { note: 0, duration: 0.2 },    // Rest
                    { note: 880, duration: 0.2 }, // A5
                    { note: 1047, duration: 0.2 }, // C6
                    { note: 1319, duration: 0.4 }, // E6
                ],
                bass: [
                    { note: 165, duration: 0.4 }, // E3
                    { note: 247, duration: 0.4 }, // B3
                    { note: 175, duration: 0.4 }, // F3
                    { note: 262, duration: 0.4 }, // C4
                ]
            },

            // 鬼屋 (SPOOKY) - 詭異沉重
            SPOOKY: {
                tempo: 110,
                melody: [
                    { note: 392, duration: 0.3 }, // G4
                    { note: 370, duration: 0.3 }, // Gb4
                    { note: 349, duration: 0.3 }, // F4
                    { note: 311, duration: 0.6 }, // Eb4
                    { note: 0, duration: 0.3 },   // Rest
                    { note: 294, duration: 0.3 }, // D4
                    { note: 277, duration: 0.3 }, // Db4
                    { note: 262, duration: 0.6 }, // C4
                ],
                bass: [
                    { note: 98, duration: 0.6 },  // G2
                    { note: 92, duration: 0.6 },  // Gb2
                    { note: 87, duration: 0.6 },  // F2
                    { note: 82, duration: 0.6 },  // E2
                ]
            },

            // 正常模式 (Fallback)
            normal: {
                tempo: 120,
                melody: [
                    { note: 659, duration: 0.15 }, // E5
                    { note: 659, duration: 0.15 }, // E5
                    { note: 0, duration: 0.15 },   // 休止符
                    { note: 659, duration: 0.15 }, // E5
                    { note: 0, duration: 0.15 },   // 休止符
                    { note: 523, duration: 0.15 }, // C5
                    { note: 659, duration: 0.15 }, // E5
                    { note: 0, duration: 0.15 },   // 休止符
                    { note: 784, duration: 0.3 },  // G5
                    { note: 0, duration: 0.3 },    // 休止符
                    { note: 392, duration: 0.3 },  // G4
                    { note: 0, duration: 0.3 },    // 休止符
                ],
                bass: [
                    { note: 196, duration: 0.3 }, // G3
                    { note: 0, duration: 0.3 },   // 休止符
                    { note: 196, duration: 0.3 }, // G3
                    { note: 0, duration: 0.3 },   // 休止符
                    { note: 196, duration: 0.3 }, // G3
                    { note: 0, duration: 0.3 },   // 休止符
                    { note: 196, duration: 0.3 }, // G3
                    { note: 0, duration: 0.3 },   // 休止符
                ]
            },

            // 星星模式 - 超興奮！更快更華麗
            star: {
                tempo: 200, // Even faster!
                melody: [
                    // Exciting ascending arpeggio
                    { note: 784, duration: 0.08 },  // G5
                    { note: 988, duration: 0.08 },  // B5
                    { note: 1175, duration: 0.08 }, // D6
                    { note: 1568, duration: 0.12 }, // G6
                    { note: 1760, duration: 0.08 }, // A6
                    { note: 1976, duration: 0.08 }, // B6
                    { note: 2093, duration: 0.15 }, // C7
                    // Descending sparkle
                    { note: 1976, duration: 0.08 }, // B6
                    { note: 1760, duration: 0.08 }, // A6
                    { note: 1568, duration: 0.08 }, // G6
                    { note: 1397, duration: 0.08 }, // F6
                    { note: 1319, duration: 0.15 }, // E6
                    // Power notes
                    { note: 1568, duration: 0.1 },  // G6
                    { note: 2093, duration: 0.1 },  // C7
                    { note: 1568, duration: 0.1 },  // G6
                    { note: 2093, duration: 0.2 },  // C7
                ],
                bass: [
                    { note: 262, duration: 0.15 }, // C4
                    { note: 330, duration: 0.15 }, // E4
                    { note: 392, duration: 0.15 }, // G4
                    { note: 523, duration: 0.15 }, // C5
                    { note: 392, duration: 0.15 }, // G4
                    { note: 330, duration: 0.15 }, // E4
                    { note: 262, duration: 0.15 }, // C4
                    { note: 196, duration: 0.15 }, // G3
                ]
            },

            // 地下模式 - 較低沉的音調
            underground: {
                tempo: 100,
                melody: [
                    { note: 392, duration: 0.2 }, // G4
                    { note: 370, duration: 0.2 }, // F#4
                    { note: 349, duration: 0.2 }, // F4
                    { note: 311, duration: 0.2 }, // D#4
                    { note: 330, duration: 0.4 }, // E4
                    { note: 294, duration: 0.2 }, // D4
                    { note: 262, duration: 0.4 }, // C4
                ],
                bass: [
                    { note: 131, duration: 0.4 }, // C3
                    { note: 147, duration: 0.4 }, // D3
                    { note: 165, duration: 0.4 }, // E3
                    { note: 175, duration: 0.4 }, // F3
                ]
            }
        };

        return patterns[mode] || patterns.normal;
    }

    playBGMNote(pattern) {
        if (!this.audioCtx) return;

        // console.log(`[AudioSystem] Playing note index: ${this.currentBGMPattern}`);

        const currentTime = this.audioCtx.currentTime;

        // 播放主旋律
        if (pattern.melody && pattern.melody.length > 0) {
            const melodyNote = pattern.melody[this.currentBGMPattern % pattern.melody.length];
            if (melodyNote && melodyNote.note > 0) {
                this.createBGMOscillator(melodyNote.note, melodyNote.duration, 0.15, 'square');
            }
        }

        // 播放低音
        if (pattern.bass && pattern.bass.length > 0) {
            const bassNote = pattern.bass[Math.floor(this.currentBGMPattern / 2) % pattern.bass.length];
            if (bassNote && bassNote.note > 0) {
                this.createBGMOscillator(bassNote.note, bassNote.duration, 0.1, 'triangle');
            }
        }

        this.currentBGMPattern++;
    }

    createBGMOscillator(frequency, duration, volume, type) {
        try {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.musicGain);

            oscillator.start(this.audioCtx.currentTime);
            oscillator.stop(this.audioCtx.currentTime + duration);

            this.bgmNodes.push({ oscillator, gainNode });

            // 清理過期節點
            setTimeout(() => {
                const index = this.bgmNodes.findIndex(node => node.oscillator === oscillator);
                if (index > -1) {
                    this.bgmNodes.splice(index, 1);
                }
            }, duration * 1000 + 100);

        } catch (e) {
            console.warn('[AudioSystem] BGM oscillator creation failed:', e);
        }
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }

        // 停止所有BGM節點
        this.bgmNodes.forEach(node => {
            try {
                node.oscillator.stop();
                node.gainNode.disconnect();
            } catch (e) {
                // 節點可能已經停止
            }
        });
        this.bgmNodes = [];
    }

    // 設定音量
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : Math.max(0, Math.min(1, volume));
        }
    }

    setSFXVolume(volume) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    setMusicVolume(volume) {
        if (this.musicGain) {
            this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // 切換靜音
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('marioMuted', this.isMuted.toString());

        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }

        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.startBGM(); // Resume BGM
        }

        return this.isMuted;
    }

    // 設定BGM節拍速度
    setBGMTempo(bpm) {
        this.bgmTempo = Math.max(60, Math.min(200, bpm));

        // 如果BGM正在播放，重新啟動以應用新節拍
        if (this.bgmInterval) {
            const wasPlaying = true;
            this.stopBGM();
            if (wasPlaying) {
                setTimeout(() => this.startBGM(), 100);
            }
        }
    }

    // 清理資源
    destroy() {
        this.stopBGM();

        if (this.audioCtx) {
            this.audioCtx.close();
        }
    }
}
