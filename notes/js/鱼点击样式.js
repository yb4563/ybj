/**
 * 鱼点击特效
 * - 样式只创建一次
 * - 节流防刷屏
 * - fixed 定位避免 scroll 换算错位
 * - tap 坐标兜底
 * - animationend 自动清理，避免 setTimeout 竞态
 * - 支持 prefers-reduced-motion
 * - DocumentFragment 批量插入
 */
(function () {
    'use strict';

    // ========== 1. 样式只创建一次 ==========
    if (document.getElementById('fish-click-style')) return;

    const style = document.createElement('style');
    style.id = 'fish-click-style';
    style.textContent = `
        @keyframes symbolSpread {
            0%   { transform: translate(0, 0) scale(0); opacity: 1; }
            100% { transform: translate(var(--x), var(--y)) scale(1.5); opacity: 0; }
        }
        .spread-symbol {
            position: fixed;
            pointer-events: none;
            animation: symbolSpread 1s ease-out forwards;
            font-size: 20px;
            will-change: transform, opacity;
            contain: layout style paint;
            z-index: 9999;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
            .spread-symbol { animation: none !important; display: none !important; }
        }
    `;
    document.head.appendChild(style);

    // ========== 2. 配置 ==========
    const EMOJIS = ['🐡', '🐠', '🐟'];
    const COUNT = 8;
    const MIN_DIST = 40;
    const MAX_DIST = 120;
    const THROTTLE_MS = 80;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastClickTime = 0;

    // ========== 3. 工具：解析点击坐标（含 tap 兜底） ==========
    function getPoint(e) {
        let cx = e.clientX;
        let cy = e.clientY;

        // tap 时某些浏览器 clientX/Y 为 0 或 undefined
        if (!cx && !cy) {
            const touch = e.changedTouches && e.changedTouches[0];
            if (touch) {
                cx = touch.clientX;
                cy = touch.clientY;
            } else {
                cx = window.innerWidth / 2;
                cy = window.innerHeight / 2;
            }
        }
        return { x: cx, y: cy };
    }

    // ========== 4. 点击处理 ==========
    document.addEventListener('click', function (e) {
        if (prefersReduced) return;

        // 节流
        const now = Date.now();
        if (now - lastClickTime < THROTTLE_MS) return;
        lastClickTime = now;

        const point = getPoint(e);

        // 批量生成
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < COUNT; i++) {
            const symbol = document.createElement('span');
            symbol.className = 'spread-symbol';
            symbol.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (MAX_DIST - MIN_DIST) + MIN_DIST;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            symbol.style.left = point.x + 'px';
            symbol.style.top = point.y + 'px';
            symbol.style.setProperty('--x', x + 'px');
            symbol.style.setProperty('--y', y + 'px');

            // 动画结束自动移除
            symbol.addEventListener('animationend', function () {
                symbol.remove();
            }, { once: true });

            // 兜底：万一 animationend 没触发（如浏览器兼容问题），2s 后强制清理
            setTimeout(function () {
                if (symbol.parentNode) symbol.remove();
            }, 2000);

            fragment.appendChild(symbol);
        }
        document.body.appendChild(fragment);
    }, { passive: true });
})();