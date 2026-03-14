// 1. Supabase Initialization
const SUPABASE_URL = "https://uqkqzkkqxwzvhfhhimjw.supabase.co"; // Gələcəkdə öz layihənizin URL-i yazılmalıdır
const SUPABASE_KEY = "sb_publishable_nWf4UqpA9YbbqgIMDzipJA_--QPcd4i"; // Öz açarınızı bura yerləşdirin
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyDCO3AfdL48gGP6XwapHy7yW1t6XW-Cx1A";
const GEMINI_MODEL = "gemini-flash-latest"; // Bulk sual generasiyası üçün flash modeli daha sürətli və limiti genişdir
let questions = []; // Dinamik yüklənəcək
let currentQuestionIndex = 0;
let answers = {};
let uploadedImages = {};
let fullName = "";
let timeLeft = 180 * 60; // 180 dəqiqə saniyə ilə
let timerInterval = null;


// 3. User Interface Logic
const landingPage = document.getElementById("landingPage");
const examSection = document.getElementById("examSection");
const resultSection = document.getElementById("resultSection");
const startForm = document.getElementById("startForm");
const fullNameInput = document.getElementById("fullName");
const displayFullName = document.getElementById("displayFullName");
const timerDisplay = document.getElementById("timerDisplay");
const navGrid = document.getElementById("questionNavGrid");
const subjectBanner = document.getElementById("subjectBanner");
const questionBody = document.getElementById("questionBody");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishExamBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
const backToHomeBtn = document.getElementById("backToHomeBtn");
const examResultInfo = document.getElementById("examResultInfo");

// Event Listeners
startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    fullName = fullNameInput.value.trim();
    if(fullName) {
        startExam();
    }
});

prevBtn.addEventListener("click", () => renderQuestion(currentQuestionIndex - 1));
nextBtn.addEventListener("click", () => renderQuestion(currentQuestionIndex + 1));
finishBtn.addEventListener("click", () => {
    if(confirm("İmtahanı bitirmək istədiyinizə əminsiniz? (Qaytarılmayacaq)")) {
        finishExam();
    }
});

viewLeaderboardBtn.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    resultSection.classList.remove("hidden");
    resultSection.classList.add("flex");
    examResultInfo.classList.add("hidden"); // Nəticə blokunu gizlədirik, ancaq cədvəl qalır
    backToHomeBtn.classList.remove("hidden");
    loadLeaderboard();
});

backToHomeBtn.addEventListener("click", () => {
    resultSection.classList.add("hidden");
    resultSection.classList.remove("flex");
    landingPage.classList.remove("hidden");
});

// Anti-Cheat (Disabled right-click and copy)
document.addEventListener("contextmenu", event => event.preventDefault());
document.addEventListener("copy", event => event.preventDefault());
document.addEventListener("cut", event => event.preventDefault());
document.addEventListener("paste", event => event.preventDefault());
window.addEventListener("beforeunload", (e) => {
    if(!examSection.classList.contains("hidden")) {
        e.preventDefault();
        e.returnValue = '';
    }
});

async function startExam() {
    landingPage.classList.add("hidden");
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.classList.add("flex");
    loadingOverlay.querySelector('p').textContent = "Suallar 3 fənn üzrə paralel yaradılır (bu daha sürətlidir)...";

    try {
        const difficultyText = "Sən Azərbaycan Respublikasının DİM (Dövlət İmtahan Mərkəzi) üzrə təcrübəli, illərin ali dərəcəli müəllimisən. Sən 10-cu siniflər üçün gerçək, məntiqli, şagirdi dərin düşünməyə vadar edəcək və tam 'Buraxılış Sınaq İmtahanı' (OTK) səviyyəsində suallar hazırlamalısan. Suallar əsla bəsit və ya birbaşa cavablı olmamalıdır! Hər bir sual DİM standartına uyğun, çaşdırıcı variantları olan (bəzən mətnləri analiz edən) formada yazılmalıdır. JSON sintaksisini qəti surətdə pozma. Diqqət: Çoxluq fərqi (\\) işarəsi istifadə etmə, yerinə (fərqi) və ya (-) yaz. Cütün içində cüt dırnaq qoyma.";
        
        const promptAz = `Sən DİM Azərbaycan dili müəllimisən. 10-cu sinif buraxılış imtahanı üçün cəmi 28 fərqli sual (id 1-dən 28-ə) yarat. ${difficultyText}
Şərt: 24 ədəd 'closed' (qapalı, 5 variantlı), 4 ədəd 'open_text' (yazılı açıq) sual olacaq. Orta və çətin suallar qarışıq olacaq.
Önəmli Təlimat: İmtahanın ən çətin sualları üçün bax bu 1 mart 2026 OTK sınağı nümunələrindəki məntiqi (Frazeoloji antonimlik, Cümlə üzvlərinin təyinsizliyi, dərin Mətn Analizi) tətbiq et. Nümunə çətinliklər: 
1. Frazeologiya: "Hansı cütlükdə frazeoloji birləşmələr eyni mənada işlənmir? (Məsələn: əl-ələ vermək – əl sıxmaq)".
2. Təyinsizləşmə: "'İş təklif edənlərin etirazını qıra bilmirlər' cümləsində hansı sözlər təyinsizləşmiş isimlərdir?".
Bu tipli ən az 3 detallaşdırılmış dərin məntiqi sual yarat. Mütləq 1 ədəd irihəcmli OXUYUB ANLAMA (Reading) mətni ver və o mətnə aid 3-4 məntiqi sual qur (Məsələn, Mətndəki personajın gizli xarakterini tapan). Qalanları isə yaxşı oxuyanların yazacağı Orta Səviyyə olsun.
CAVABIN YALNIZ VƏ YALNIZ JSON ARRAY FORMATINDA OLSUN. MƏTNLƏRİ \`text\` daxilində tam, qaçış simvolları nizamlanmış yaz.
Qapalı nümunə: {"id": 1, "subject": "Azərbaycan dili", "type": "closed", "text": "...", "options": ["A", "B", "C", "D", "E"], "correct": "C", "points": 1}
Açıq nümunə: {"id": 25, "subject": "Azərbaycan dili", "type": "open_text", "text": "...", "points": 2}`;

        const promptMath = `Sən sərt süllü DİM Riyaziyyat müəllimisən. 10-cu sinif üçün cəmi 25 sual (id 29-dan 53-ə) yarat. Şərt: İmtahanın ən çətin və seçici hissəsi bu olacaq. ${difficultyText}
Statistika: 13 dənə 'closed' (5 variantlı), 5 dənə 'open_text' (kodlaşdırılan, yalnız rəqəm yazılan), 7 dənə 'open_solution' (çox çətin, gedişat və şəkil tələb edən) sual.
Önəmli Təlimat: İmtahanın ən çətin sualları üçün OTK sınağındakı bu ən çox səhv edilən məntiqi sualları (və ya onların alternativi) mütləq əlavə et:
1. Modul tənliyi: Məsələn, "|x - 2| > x + 3 həllini tapın." tipli qrafik və xassə tələb edən.
2. Funksiya minimumları: Məsələn, "f(x) = x² - 4x + 3 funksiyasının minimum nöqtəsində qiyməti nə qədərdir?" tipli diskriminant/vertex məsələləri.
3. Həndəsə: Məsələn, "Bir üçbucaqda bucaqlar nisbəti 2:3:4-dür. Ən böyük bucaq neçə dərəcədir? (Cavab 96)".
Bu tipli sualları mütləq daxil et! Qalanları orta səviyyə (nisbət/proqressiya/köklər) olsun.
CAVABIN YALNIZ VƏ YALNIZ JSON ARRAY FORMATINDA OLSUN.
Closed nümunəsi: {"id": 29, "subject": "Riyaziyyat", "type": "closed", "text": "...", "options": ["A", "B", "C", "D", "E"], "correct": "A", "points": 1}
Open Solution nümunəsi: {"id": 47, "subject": "Riyaziyyat", "type": "open_solution", "text": "...", "points": 4}`;

        const promptEng = `You are a native English expert & DİM teacher. Create exactly 28 questions (id 54 to 81) for a 10th-grade national exam (Buraxılış). Level: Strong Intermediate (B1-B2 level logic). Do not use basic "1+1" questions. Require analysis.
Structure: 24 'closed' (5 options), 4 'open_text' (detailed writing, inference).
Content: MUST include a 150-word compelling Reading Comprehension passage.
CRITICAL INSTRUCTION: Include these highly tricked, advanced OTK-style questions as your hardest models:
1. Hard Reading inference: e.g., "I can’t find time for education because I have to work..." -> "What's the reason? B) Family responsibilities".
2. Hard Reported Speech backshifts: e.g., "He said: 'I will help you tomorrow.' → Reported: He said that he _____ me the next day. (B: would help)".
3. Phrasal Verbs/Idioms: e.g., "The workers couldn’t break _____ the employers’ objections. (C: through)".
Mix these extremely hard types with standard medium ones (Nouns, Quantifiers) so the general audience gets 70-85, but top students struggle on these.
RESPOND ONLY AS A VALID JSON ARRAY. NO MARKDOWN TEXT AROUND IT.
Closed example: {"id": 54, "subject": "İngilis dili", "type": "closed", "text": "...", "options": ["A", "B", "C", "D", "E"], "correct": "B", "points": 1}
Open Text example: {"id": 78, "subject": "İngilis dili", "type": "open_text", "text": "...", "points": 2}`;

        // Asinxron fetch funksiyası (json extract mantığı ilə)
        async function fetchSubjectQuestions(promptContent) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: promptContent }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                if(res.status === 429) throw new Error("API Limitine çatıldı (429).");
                throw new Error(data.error?.message || "Bilinməyən API xətası");
            }
            if (!data.candidates || data.candidates.length === 0) throw new Error("AI hissəvi cavab qaytarmadı.");
            
            let text = data.candidates[0].content.parts[0].text;
            
            try {
                // Tərs slaş (\) kimi JSON qıran simvolları təmizləyirik (xüsusən \ B tipli riyazi çıxmalar)
                const sanitizedText = text.replace(/\\\\ /g, ' - ').replace(/\\\\/g, '/');
                return JSON.parse(sanitizedText);
            } catch(e) {
                console.error("Failed to parse subject JSON:", text);
                throw new Error("AI düzgün JSON formatında qaytarmadı: " + e.message);
            }
        }

        // Hər 3 fənni saniyələr içində PARALEL (eyni anda) yükləyirik
        const [azData, mathData, engData] = await Promise.all([
            fetchSubjectQuestions(promptAz),
            fetchSubjectQuestions(promptMath),
            fetchSubjectQuestions(promptEng)
        ]);

        questions = [...azData, ...mathData, ...engData];

        if(questions.length < 81) {
            console.warn("AI didn't generate exactly 81 questions, using what we got.", questions.length);
        }
    } catch(e) {
        console.error("Sual generasiyası xətası:", e);
        alert(`Sualların generasiyasında xəta oldu: ${e.message}\\nSəhifəni yeniləyib bir daha yoxlayın.`);
        loadingOverlay.classList.remove("flex");
        loadingOverlay.classList.add("hidden");
        landingPage.classList.remove("hidden");
        return;
    }

    loadingOverlay.classList.remove("flex");
    loadingOverlay.classList.add("hidden");
    
    examSection.classList.remove("hidden");
    examSection.classList.add("flex");
    displayFullName.textContent = fullName;
    
    buildNavGrid();
    renderQuestion(0);
    
    // Timer
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
    }, 1000);
}

function buildNavGrid() {
    navGrid.innerHTML = "";
    questions.forEach((q, index) => {
        const btn = document.createElement("button");
        btn.textContent = index + 1;
        btn.className = "w-10 h-10 sm:w-full sm:h-auto sm:py-2 border shrink-0 rounded-md text-sm font-medium transition-colors btn-nav-pending flex items-center justify-center";
        btn.id = `navBtn-${index}`;
        btn.onclick = () => renderQuestion(index);
        navGrid.appendChild(btn);
    });
}

function updateNavButtons() {
    questions.forEach((q, index) => {
        const btn = document.getElementById(`navBtn-${index}`);
        btn.classList.remove("btn-nav-active", "btn-nav-answered", "btn-nav-pending");
        if (index === currentQuestionIndex) {
            btn.classList.add("btn-nav-active");
            // If it's active AND answered, keep it primarily active but maybe a different shade (handled via css if needed)
        } else if (answers[index] !== undefined && answers[index] !== "") {
            btn.classList.add("btn-nav-answered");
        } else {
            btn.classList.add("btn-nav-pending");
        }
    });
}

function renderQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    // Save current open answers before switching
    saveCurrentAnswer();
    
    currentQuestionIndex = index;
    const q = questions[index];
    subjectBanner.textContent = q.subject;
    
    
    const mobileIndicator = document.getElementById("mobileQuestionNumber");
    if(mobileIndicator) {
        mobileIndicator.textContent = `Sual: ${index + 1} / ${questions.length}`;
    }
    
    // Auto scroll nav grid on mobile
    const activeBtn = document.getElementById(`navBtn-${index}`);
    if(activeBtn && window.innerWidth < 640) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    let html = `<h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-6 leading-relaxed">${q.text}</h2>`;
    
    if (q.type === "closed") {
        html += `<div class="space-y-3">`;
        q.options.forEach((opt, i) => {
            const isChecked = (answers[index] === opt) ? "checked" : "";
            html += `
                <label class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input type="radio" name="q${q.id}" value="${opt}" class="w-5 h-5 text-blue-600 focus:ring-blue-500" ${isChecked} onchange="setAnswer('${opt}')">
                    <span class="ml-3 text-gray-700 font-medium">${opt}</span>
                </label>
            `;
        });
        html += `</div>`;
    } else if (q.type === "open_text") {
        html += `
            <textarea id="openTextVal" rows="5" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none text-gray-700" placeholder="Cavabınızı buraya yazın...">${answers[index] || ''}</textarea>
        `;
    } else if (q.type === "open_solution") {
        const uploadedImg = uploadedImages[index] || '';
        html += `
            <textarea id="openTextVal" rows="4" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none text-gray-700 mb-4" placeholder="Həllin izahını bura yaza bilərsiniz (və ya aşağıda şəkil yükləyin)...">${answers[index] || ''}</textarea>
            
            <label class="block mb-2 font-semibold text-gray-700">Həllin şəkli (İstəyə bağlı)</label>
            <input type="file" accept="image/*" id="fileUploader" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors">
            <img id="imagePreview" src="${uploadedImg}" class="image-preview" style="display: ${uploadedImg ? 'block' : 'none'}">
        `;
    }

    questionBody.innerHTML = html;
    
    if (q.type === "open_solution") {
        document.getElementById("fileUploader")?.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(r) {
                    uploadedImages[currentQuestionIndex] = r.target.result;
                    document.getElementById("imagePreview").src = r.target.result;
                    document.getElementById("imagePreview").style.display = "block";
                    updateNavButtons();
                }
                reader.readAsDataURL(file);
            }
        });
    }

    prevBtn.classList.toggle("hidden", index === 0);
    if (index === questions.length - 1) {
        nextBtn.classList.add("hidden");
    } else {
        nextBtn.classList.remove("hidden");
    }
    
    updateNavButtons();
}

function setAnswer(val) {
    answers[currentQuestionIndex] = val;
    updateNavButtons();
}

function saveCurrentAnswer() {
    const textarea = document.getElementById("openTextVal");
    if(textarea) {
        answers[currentQuestionIndex] = textarea.value;
    }
}

async function finishExam() {
    clearInterval(timerInterval);
    saveCurrentAnswer();
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.classList.add("flex");
    
    let subjectScores = {};
    
    // Calculate max possible points for each subject
    questions.forEach(q => {
        if (!subjectScores[q.subject]) subjectScores[q.subject] = { earned: 0, max: 0 };
        subjectScores[q.subject].max += (q.points || 1);
    });
    
    // 1. Calculate Closed Questions
    questions.forEach((q, index) => {
        if(q.type === "closed") {
            if(answers[index] === q.correct) {
                subjectScores[q.subject].earned += (q.points || 1);
            }
        }
    });

    // 2. AI Submission (Gemini API)
    // Açıq sualların və şəkillərin Gemini API ilə yoxlanması
    for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        if (q.type !== "closed" && answers[index] && answers[index].trim().length > 0) {
            try {
                let promptText = `Sual: ${q.text}\nŞagirdin cavabı: ${answers[index]}\nBu sualın maksimal balı ${q.points}-dır. Şagirdin verdiyi cavabı (və varsa şəklini) yoxla və 0 ilə ${q.points} arasında bal ver. Yalnız və yalnız balı rəqəm olaraq qaytar (məsələn: 2 və ya 3.5).`;
                let contents = [{
                    parts: [{ text: promptText }]
                }];

                // Əgər şəkil də varsa onu da göndərək
                if (q.type === "open_solution" && uploadedImages[index]) {
                    const base64Image = uploadedImages[index];
                    const mimeTypeMatch = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
                    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
                    const base64Data = base64Image.split(",")[1];
                    
                    contents[0].parts.push({
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    });
                }

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: contents })
                });

                const data = await response.json();
                if (data.candidates && data.candidates.length > 0) {
                    const aiResult = data.candidates[0].content.parts[0].text.trim();
                    const aiScore = parseFloat(aiResult);
                    if (!isNaN(aiScore)) {
                        subjectScores[q.subject].earned += Math.min(Math.max(0, aiScore), (q.points || 1));
                    }
                }
            } catch (err) {
                console.error("Gemini API error for question " + index, err);
                // Xəta olarsa, şərti olaraq mətn daxil edildiyi üçün min 1 bal verə bilərik (və ya 0 qala bilər)
            }
        }
    }

    // 300 bal (Hər fənn 100 bal) sisteminə uyğunlaşdıraq:
    let finalScore = 0;
    for (const sub in subjectScores) {
        if(subjectScores[sub].max > 0) {
            // Fənnin yığdığı nisbi bal (maksimum 100 üzerinden)
            let relativeSubScore = (subjectScores[sub].earned / subjectScores[sub].max) * 100;
            finalScore += relativeSubScore;
        }
    }
    
    finalScore = Math.min(300, Math.round(finalScore));

    document.getElementById("finalScoreDisplay").textContent = `${finalScore} / 300`;

    // 3. Supabase-ə Göndərilmə
    try {
        const { error } = await supabaseClient
            .from('results')
            .insert([
                { 
                    full_name: fullName, 
                    score: finalScore, 
                    answers: answers, 
                    // image_urls would ideally be real URLs after uploading to Supabase Storage, placeholder here.
                    image_urls: [] 
                }
            ]);
            
        if (error) console.error("Data save error:", error);
    } catch(e) {
        console.error("Supabase API error (Check keys/URL)", e);
    }

    loadingOverlay.classList.remove("flex");
    loadingOverlay.classList.add("hidden");
    examSection.classList.remove("flex");
    examSection.classList.add("hidden");
    
    document.getElementById("resultSection").classList.remove("hidden");
    document.getElementById("resultSection").classList.add("flex");

    loadLeaderboard();
}

async function loadLeaderboard() {
    const tbody = document.getElementById("leaderboardBody");
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Data yüklənir...</td></tr>`;
    
    try {
        const { data, error } = await supabaseClient
            .from('results')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        tbody.innerHTML = "";
        if(data && data.length > 0) {
            data.forEach((row, idx) => {
                const dateSplit = new Date(row.created_at).toLocaleDateString();
                const tr = document.createElement('tr');
                tr.className = "border-b last:border-b-0 hover:bg-gray-50 transition-colors";
                tr.innerHTML = `
                    <td class="py-3 px-4 font-bold text-gray-500">${idx + 1}</td>
                    <td class="py-3 px-4 text-gray-800 font-medium">${row.full_name}</td>
                    <td class="py-3 px-4 text-right font-bold text-blue-600">${row.score}</td>
                    <td class="py-3 px-4 text-right text-gray-400 text-sm hidden sm:table-cell">${dateSplit}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Heç bir nəticə tapılmadı. İlk siz olun!</td></tr>`;
        }
    } catch(e) {
        console.error("Leaderboard load err:", e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Liderlik cədvəli göstərilə bilmədi. URL və Key yoxlanılmalıdır.</td></tr>`;
    }
}
