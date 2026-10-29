

     // 🌟 优化点：只执行一次样式创建

     let styleCreated = false; // 标记是否已创建样式

     function createStyleOnce() {

       if (styleCreated) return; // 已创建则直接返回

       

       const style = document.createElement('style');

       style.textContent = `

         @keyframes symbolSpread {

           0% { transform: translate(0, 0) scale(0); opacity: 1; }

           100% { transform: translate(var(--x), var(--y)) scale(1.5); opacity: 0; }

         }

         .spread-symbol {

           position: absolute;

           pointer-events: none;

           animation: symbolSpread 1s ease-out forwards;

           font-size: 20px;

           -webkit-text-stroke: 1px #ffffff;

         }

       `;

       document.head.appendChild(style);

       styleCreated = true; // 标记为已创建

     }

     // 点击事件逻辑

     document.addEventListener('click', (e) => {

       createStyleOnce(); // 每次点击先检查并创建样式（仅首次生效）

       

       for (let i = 0; i < 8; i++) {

         const symbol = document.createElement('span');

         symbol.className = 'spread-symbol';

         symbol.textContent = '🐡🐠🐟';

         

         const angle = Math.random() * Math.PI * 2;

         const distance = Math.random() * 50 + 20;

         const x = Math.cos(angle) * distance;

         const y = Math.sin(angle) * distance;

         

         symbol.style.left = `${e.clientX + window.scrollX}px`;

         symbol.style.top = `${e.clientY + window.scrollY}px`;

         symbol.style.setProperty('--x', `${x}px`);

         symbol.style.setProperty('--y', `${y}px`);

         

         document.body.appendChild(symbol);

         setTimeout(() => symbol.remove(), 1000);

       }

     });