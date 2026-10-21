/**
 * 注释清除工具核心逻辑
 * 已完全内联您指定的 JS 代码：https://cdn.jsdelivr.net/gh/yb4563/ybj@main/notes/js/注释.js
 */
(function() {
    // --- 获取 DOM 元素 ---
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const inputCount = document.getElementById('inputCount');
    const outputCount = document.getElementById('outputCount');
    const removedCountSpan = document.getElementById('removedCount');

    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const resetBtn = document.getElementById('resetBtn');
    const previewBtn = document.getElementById('previewBtn');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const fullscreenIframe = document.getElementById('fullscreenIframe');
    
    const uploadBtn = document.getElementById('uploadBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInput = document.getElementById('fileInput');

    // --- 示例代码 ---
    const SAMPLE_CODE = [
        '/* 示例 CSS 注释 */',
        'body {',
        '    color: #333; /* 文字颜色 */',
        '    margin: 0;',
        '    display: flex; justify-content: center; align-items: center; height: 100vh;',
        '    background: #f0f4f8; font-family: sans-serif;',
        '}',
        '.box { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }',
        '',
        '// 示例 JavaScript 注释',
        'function greet() {',
        '    // 这是一条网址，不应该被误杀！',
        '    const url = "https://www.example.com"; ',
        '    console.log("Hello", url); // 打印问候语',
        '    document.getElementById("text").innerText = "代码运行正常，注释已被完美清除！";',
        '    document.getElementById("link").href = url;',
        '}',
        '',
        '<!-- 这是一段 HTML 注释 -->',
        '<div class="box">',
        '    <h2 id="text">等待 JS 执行...</h2>',
        '    <p>测试网址保留：<a id="link" href="#">点击此处</a></p>',
        '    <button onclick="greet()">点击测试</button>',
        '</div>',
        '<script>window.onload = greet;<\/script>'
    ].join('\n');

    // --- 界面更新函数 ---
    function updateCharCounts() {
        inputCount.textContent = inputArea.value.length;
        outputCount.textContent = outputArea.value.length;
    }

    function updateRemovedCount(count) {
        removedCountSpan.textContent = count;
    }

    // --- 核心注释剥离算法 (无惧特殊符号) ---
    function safeStripComments(source) {
        if (!source) return { result: '', removedCount: 0 };
        let removedCount = 0;
        const placeholders = [];
        const combinedTagRegex = /<(script|style)([^>]*)>([\s\S]*?)<\/\1>/gi;
        
        let processed = source.replace(combinedTagRegex, (match, tagName, attrs, innerContent) => {
            let strippedInner = '';
            if (tagName.toLowerCase() === 'script') {
                strippedInner = stripJS(innerContent);
            } else {
                strippedInner = stripCSS(innerContent);
            }
            
            const jsBlocks = (innerContent.match(/\/\*[\s\S]*?\*\/|(^|[^\\:])\/\/[^\n]*/gm) || []).length;
            const cssBlocks = (innerContent.match(/\/\*[\s\S]*?\*\//g) || []).length;
            removedCount += (tagName.toLowerCase() === 'script' ? jsBlocks : cssBlocks);

            const newTag = `<${tagName}${attrs}>${strippedInner}</${tagName}>`;
            const ph = `___PROTECTED_TAG_${placeholders.length}___`;
            placeholders.push(newTag);
            return ph;
        });

        processed = processed.replace(/<!--[\s\S]*?-->/g, () => {
            removedCount++;
            return '';
        });

        placeholders.forEach((tagContent, index) => {
            processed = processed.replace(`___PROTECTED_TAG_${index}___`, tagContent);
        });

        return { result: processed, removedCount };
    }

    function stripJS(code) {
        let result = '';
        let i = 0, len = code.length, state = 0; 
        let lastNonSpace = '';
        
        while (i < len) {
            const char = code[i];
            const nextChar = code[i + 1] || '';

            if (state === 0) {
                if (char === '/' && nextChar === '/') { state = 6; i += 2; }
                else if (char === '/' && nextChar === '*') { state = 5; i += 2; }
                else if (char === '"') { state = 1; result += char; i++; lastNonSpace = '"'; }
                else if (char === "'") { state = 2; result += char; i++; lastNonSpace = "'"; }
                else if (char === '`') { state = 3; result += char; i++; lastNonSpace = '`'; }
                else if (char === '/') {
                    if (/[=(,:;!&|?{}[\]+\-*%^~]/.test(lastNonSpace) || lastNonSpace === 'return' || lastNonSpace === '') {
                        state = 4; result += char; i++;
                    } else { result += char; i++; lastNonSpace = '/'; }
                } else {
                    if (char.trim() !== '') lastNonSpace = char;
                    result += char; i++;
                }
            } else if (state === 6) {
                if (char === '\n' || char === '\r') { state = 0; result += char; i++; }
                else { i++; }
            } else if (state === 5) {
                if (char === '*' && nextChar === '/') { state = 0; i += 2; }
                else { i++; }
            } else if (state === 1 || state === 2) {
                result += char;
                if (char === '\\') { result += nextChar; i += 2; }
                else if ((state === 1 && char === '"') || (state === 2 && char === "'")) { state = 0; i++; }
                else { i++; }
            } else if (state === 3) {
                result += char;
                if (char === '\\') { result += nextChar; i += 2; }
                else if (char === '`') { state = 0; i++; }
                else { i++; }
            } else if (state === 4) {
                result += char;
                if (char === '\\') { result += nextChar; i += 2; }
                else if (char === '/') { state = 0; i++; }
                else { i++; }
            }
        }
        return result;
    }

    function stripCSS(code) {
        let result = '';
        let i = 0, len = code.length, state = 0;
        while (i < len) {
            const char = code[i];
            const nextChar = code[i + 1] || '';
            
            if (state === 0) {
                if (char === '/' && nextChar === '*') { state = 3; i += 2; }
                else if (char === '"') { state = 1; result += char; i++; }
                else if (char === "'") { state = 2; result += char; i++; }
                else { result += char; i++; }
            } else if (state === 3) {
                if (char === '*' && nextChar === '/') { state = 0; i += 2; }
                else { i++; }
            } else if (state === 1 || state === 2) {
                result += char;
                if (char === '\\') { result += nextChar; i += 2; }
                else if ((state === 1 && char === '"') || (state === 2 && char === "'")) { state = 0; i++; }
                else { i++; }
            }
        }
        return result;
    }

    // --- 交互事件 ---
    function performClean() {
        const rawInput = inputArea.value;
        if (!rawInput.trim()) {
            outputArea.value = '';
            updateRemovedCount(0);
            updateCharCounts();
            return;
        }

        try {
            const { result, removedCount } = safeStripComments(rawInput);
            outputArea.value = result;
            updateRemovedCount(removedCount);
            updateCharCounts();
        } catch (e) {
            alert("解析时发生意外: " + e.message);
        }
    }

    function clearAll() {
        inputArea.value = '';
        outputArea.value = '';
        updateRemovedCount(0);
        updateCharCounts();
        fileInput.value = '';
        inputArea.focus();
    }

    function loadSample() {
        inputArea.value = SAMPLE_CODE;
        performClean();
    }

    async function copyResult() {
        const resultText = outputArea.value;
        if (!resultText) { alert('没有可复制的内容。'); return; }
        try {
            await navigator.clipboard.writeText(resultText);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制!';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 1500);
        } catch (err) {
            outputArea.select();
            document.execCommand('copy');
            alert('已尝试复制（兼容模式）');
        }
    }

    // --- 文件上传与下载 ---
    uploadBtn.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            inputArea.value = evt.target.result;
            performClean();
        };
        reader.readAsText(file, 'UTF-8');
        this.value = '';
    });

    downloadBtn.addEventListener('click', function() {
        const content = outputArea.value;
        if (!content.trim()) {
            alert('没有可下载的内容，请先清除注释。');
            return;
        }
        let ext = '.html';
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            const lastDot = fileName.lastIndexOf('.');
            if (lastDot !== -1) ext = fileName.substring(lastDot);
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `注释好的代码${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    // --- 预览功能 ---
    function openPreview() {
        const code = outputArea.value;
        if (!code.trim()) {
            alert('请先点击“清除注释”生成结果，再进行预览。');
            return;
        }
        try {
            const doc = fullscreenIframe.contentDocument || fullscreenIframe.contentWindow.document;
            doc.open(); doc.write(code); doc.close();
            document.body.classList.add('fullscreen-mode');
        } catch (e) {
            alert('预览渲染失败: ' + e.message);
        }
    }

    function closePreview() {
        document.body.classList.remove('fullscreen-mode');
        setTimeout(() => {
            const doc = fullscreenIframe.contentDocument || fullscreenIframe.contentWindow.document;
            doc.open(); doc.write(''); doc.close();
        }, 100);
    }

    // --- 事件绑定 ---
    inputArea.addEventListener('input', function() {
        const len = inputArea.value.length;
        inputCount.textContent = len;
        if (len === 0) {
            outputArea.value = '';
            outputCount.textContent = '0';
            updateRemovedCount(0);
        }
    });

    clearBtn.addEventListener('click', performClean);
    copyBtn.addEventListener('click', copyResult);
    sampleBtn.addEventListener('click', loadSample);
    resetBtn.addEventListener('click', clearAll);
    previewBtn.addEventListener('click', openPreview);
    closePreviewBtn.addEventListener('click', closePreview);

    // 涟漪与抖动特效
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        btn.classList.add('ripple-active');
        setTimeout(() => btn.classList.remove('ripple-active'), 500);
        if (btn.classList.contains('sweep-btn')) {
            btn.classList.add('sweep-active');
            setTimeout(() => btn.classList.remove('sweep-active'), 400);
        }
    });

    // 快捷键
    inputArea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            performClean();
        }
    });

    // 初始化
    updateCharCounts();
    updateRemovedCount(0);
    inputArea.focus();
})();