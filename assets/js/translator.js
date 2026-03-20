document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Set Current Year safely
    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // --- State & DOM Elements ---
    
    // Navigation
    const navTranslate = document.getElementById("nav-translate");
    const navHistory = document.getElementById("nav-history");
    const translateView = document.getElementById("translate-view");
    const historyView = document.getElementById("history-view");

    // Translation Elements
    const sourceText = document.getElementById("source-text");
    const charCount = document.getElementById("char-count");
    
    const sourceLangLabel = document.getElementById("source-lang-label");
    const targetLangLabel = document.getElementById("target-lang-label");
    const translateBtnMobile = document.getElementById("translate-btn-mobile");
    const translateBtnCta = document.getElementById("translate-btn-cta");
    
    const outputCard = document.getElementById("output-card");
    const copyBtn = document.getElementById("copy-btn");
    const loadingState = document.getElementById("loading-state");
    const translatedTextEl = document.getElementById("translated-text");
    const emptyState = document.getElementById("empty-state");
    
    // History Elements
    const historyCount = document.getElementById("history-count");
    const historyEmpty = document.getElementById("history-empty");
    const historyList = document.getElementById("history-list");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    let isPending = false;
    let currentFilteredText = "";
    
    // Disable translate buttons initially
    updateButtonStates();

    // --- Navigation Logic ---
    function switchView(view) {
        if (view === "translate") {
            translateView.classList.remove("hidden");
            historyView.classList.add("hidden");
            
            navTranslate.className = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-primary text-primary-foreground shadow-lg shadow-primary/25";
            navHistory.className = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground";
        } else {
            translateView.classList.add("hidden");
            historyView.classList.remove("hidden");
            
            navHistory.className = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-primary text-primary-foreground shadow-lg shadow-primary/25";
            navTranslate.className = "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground";
            
            renderHistory();
        }
    }

    navTranslate.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = "translate";
        switchView("translate");
    });

    navHistory.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = "history";
        switchView("history");
    });

    // Check hash on load
    if (window.location.hash === "#history") {
        switchView("history");
    } else {
        switchView("translate");
    }


    // --- Translation Logic ---

    // Input handlers
    sourceText.addEventListener("input", (e) => {
        const text = e.target.value;
        charCount.textContent = `${text.length} chars`;
        
        if (text.trim().length === 0) {
            // Reset state if empty
            emptyState.classList.remove("hidden");
            translatedTextEl.classList.add("hidden");
            copyBtn.classList.add("hidden");
            translatedTextEl.textContent = "";
            outputCard.classList.remove("ring-2", "ring-primary/20", "shadow-primary/10");
            currentFilteredText = "";
            
            // Revert labels to default
            sourceLangLabel.textContent = "Detect Language";
            targetLangLabel.textContent = "Translation";
        }
        
        updateButtonStates();
    });

    sourceText.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") {
            handleTranslate();
        }
    });

    function updateButtonStates() {
        const hasText = sourceText.value.trim().length > 0;
        const disabled = isPending || !hasText;
        
        translateBtnMobile.disabled = disabled;
        if (translateBtnCta) translateBtnCta.disabled = disabled;
    }

    function setLoading(loading) {
        isPending = loading;
        updateButtonStates();
        
        if (loading) {
            emptyState.classList.add("hidden");
            translatedTextEl.classList.add("hidden");
            loadingState.classList.remove("hidden");
            copyBtn.classList.add("hidden");
            outputCard.classList.remove("ring-2", "ring-primary/20", "shadow-primary/10");
            
            // Mobile button
            const mobileBtnText = translateBtnMobile.querySelector('.hidden-on-loading');
            const mobileSpinner = translateBtnMobile.querySelector('.loading-spinner');
            const mobileLoadingText = translateBtnMobile.querySelector('.loading-text');
            if(mobileBtnText) mobileBtnText.classList.add('hidden');
            if(mobileSpinner) mobileSpinner.classList.remove('hidden');
            if(mobileLoadingText) mobileLoadingText.classList.remove('hidden');
            
            // CTA button logic
            if (translateBtnCta) {
                const ctaText = translateBtnCta.querySelector('.btn-text');
                const ctaIcon = translateBtnCta.querySelector('.btn-icon');
                if (ctaText) ctaText.textContent = "Translating...";
                if (ctaIcon) ctaIcon.classList.add('hidden');
            }
            
        } else {
            loadingState.classList.add("hidden");
            
            // Mobile button
            const spans = translateBtnMobile.querySelectorAll('span');
            spans.forEach(span => {
                 if(span.classList.contains('loading-text')) span.classList.add('hidden');
                 else span.classList.remove('hidden');
            });
            const spinners = translateBtnMobile.querySelectorAll('.loading-spinner');
            spinners.forEach(spin => spin.classList.add('hidden'));
            const icons = translateBtnMobile.querySelectorAll('.hidden-on-loading');
            icons.forEach(i => i.classList.remove('hidden'));
            
            // CTA button logic
            if (translateBtnCta) {
                const ctaText = translateBtnCta.querySelector('.btn-text');
                const ctaIcon = translateBtnCta.querySelector('.btn-icon');
                if (ctaText) ctaText.textContent = "Translate Text";
                if (ctaIcon) ctaIcon.classList.remove('hidden');
            }
        }
    }

    async function detectLanguage(text) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data[2] || 'auto';
        } catch (error) {
            console.error('Language detection error:', error);
            return 'auto';
        }
    }

    async function handleTranslate() {
        const textToTranslate = sourceText.value.trim();
        if (!textToTranslate || isPending) return;

        setLoading(true);
        currentFilteredText = textToTranslate;

        try {
            const detectedLang = await detectLanguage(textToTranslate);
            const isAssamese = (detectedLang === 'as');
            
            const sl = detectedLang === 'auto' ? 'auto' : detectedLang;
            const tl = isAssamese ? "en" : "as";
            
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Translation API response not OK");
            }

            const data = await response.json();
            
            if (data && data[0]) {
                const translated = data[0].map(item => item[0]).join("");
                
                // Update UI Labels based on auto-detection
                sourceLangLabel.textContent = isAssamese ? "Assamese (Detected)" : "English (Detected)";
                targetLangLabel.textContent = isAssamese ? "English" : "Assamese";
                
                if (isAssamese) {
                    sourceText.classList.add("font-assamese");
                    translatedTextEl.classList.remove("font-assamese");
                } else {
                    sourceText.classList.remove("font-assamese");
                    translatedTextEl.classList.add("font-assamese");
                }

                translatedTextEl.textContent = translated;
                
                // Show output
                emptyState.classList.add("hidden");
                translatedTextEl.classList.remove("hidden");
                copyBtn.classList.remove("hidden");
                outputCard.classList.add("ring-2", "ring-primary/20", "shadow-primary/10");
                
                // Add to history
                saveToHistory(textToTranslate, translated, isAssamese);
            } else {
                throw new Error("Empty translation returned");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to translate text. Please try again.", true);
            emptyState.classList.remove("hidden");
        } finally {
            setLoading(false);
        }
    }

    const translateButtons = [translateBtnMobile];
    if (translateBtnCta) translateButtons.push(translateBtnCta);
    
    translateButtons.forEach(btn => {
        btn.addEventListener("click", handleTranslate);
    });

    // Copy to clipboard
    copyBtn.addEventListener("click", async () => {
        const text = translatedTextEl.textContent;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            const icon = copyBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'check');
            lucide.createIcons();
            
            showToast("Translation copied to clipboard");
            
            setTimeout(() => {
                icon.setAttribute('data-lucide', 'copy');
                lucide.createIcons();
            }, 2000);
        } catch (err) {
            showToast("Failed to copy", true);
        }
    });

    // --- History Logic ---
    function getHistory() {
        const hist = localStorage.getItem("translationHistory");
        return hist ? JSON.parse(hist) : [];
    }

    function saveToHistory(sourceText, translatedText, isAssToEn) {
        const history = getHistory();
        const newItem = {
            id: Date.now(),
            sourceText,
            translatedText,
            isAssameseToEnglish: isAssToEn,
            createdAt: new Date().toISOString()
        };
        // Add to beginning
        history.unshift(newItem);
        // Keep only top 50
        if (history.length > 50) history.pop();
        
        localStorage.setItem("translationHistory", JSON.stringify(history));
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }

    function renderHistory() {
        const history = getHistory();
        historyCount.textContent = `${history.length} items`;
        
        historyList.innerHTML = "";
        
        if (history.length === 0) {
            historyEmpty.classList.remove("hidden");
            if (clearHistoryBtn) clearHistoryBtn.classList.add("hidden");
        } else {
            historyEmpty.classList.add("hidden");
            if (clearHistoryBtn) clearHistoryBtn.classList.remove("hidden");
            
            history.forEach((item, index) => {
                const card = document.createElement("div");
                card.className = "group hover:shadow-md transition-all duration-200 border rounded-xl border-border/60 hover:border-primary/20 bg-card";
                card.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.05}s`;
                card.style.opacity = "0"; // Will be animated
                
                const sourceLang = item.isAssameseToEnglish !== false ? "Assamese" : "English";
                const targetLang = item.isAssameseToEnglish !== false ? "English" : "Assamese";
                card.innerHTML = `
                  <div class="p-4 md:p-6 grid gap-4 md:grid-cols-[1fr,auto,1fr,auto] items-start md:items-center">
                    <div class="space-y-1">
                      <p class="${item.isAssameseToEnglish !== false ? 'font-assamese' : ''} text-lg text-foreground/90 leading-relaxed">${item.sourceText}</p>
                      <p class="text-xs text-muted-foreground flex items-center gap-1">
                        <span class="uppercase tracking-wider font-semibold text-[10px]">${sourceLang}</span>
                      </p>
                    </div>

                    <div class="hidden md:flex justify-center text-muted-foreground/30">
                      <i data-lucide="arrow-right" class="w-5 h-5"></i>
                    </div>

                    <div class="space-y-1">
                      <p class="${item.isAssameseToEnglish !== false ? '' : 'font-assamese'} text-lg text-foreground/90 leading-relaxed">${item.translatedText}</p>
                      <p class="text-xs text-muted-foreground flex items-center gap-1">
                        <span class="uppercase tracking-wider font-semibold text-[10px]">${targetLang}</span>
                      </p>
                    </div>

                    <div class="flex flex-row md:flex-col items-center gap-2 justify-end mt-2 md:mt-0 md:pl-4 md:border-l border-border/50">
                      <div class="text-[10px] text-muted-foreground whitespace-nowrap">
                        ${formatTime(item.createdAt)}
                      </div>
                      <button class="history-copy-btn h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-colors" data-text="${item.translatedText.replace(/"/g, '&quot;')}">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                `;
                historyList.appendChild(card);
            });
            
            lucide.createIcons();
            
            // Add copy listeners for history items
            document.querySelectorAll('.history-copy-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const text = e.currentTarget.getAttribute('data-text');
                    try {
                        await navigator.clipboard.writeText(text);
                        const icon = e.currentTarget.querySelector('i');
                        icon.setAttribute('data-lucide', 'check');
                        lucide.createIcons();
                        
                        showToast("Translated text copied");
                        
                        setTimeout(() => {
                            icon.setAttribute('data-lucide', 'copy');
                            lucide.createIcons();
                        }, 2000);
                    } catch (err) {
                        showToast("Failed to copy", true);
                    }
                });
            });
        }
    }

    // Clear History Logic
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all translation history?")) {
                localStorage.removeItem("translationHistory");
                renderHistory();
                showToast("History cleared successfully");
            }
        });
    }

    // --- Toast Notifications ---
    function showToast(message, isError = false) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${isError ? 'border-destructive text-destructive' : ''}`;
        
        toast.innerHTML = `
            <i data-lucide="${isError ? 'alert-circle' : 'check-circle-2'}" class="w-5 h-5 ${isError ? 'text-destructive' : 'text-primary'}"></i>
            <span class="text-sm font-medium">${message}</span>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease-out forwards";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});
