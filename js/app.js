// Mix Design App Controller
document.addEventListener("DOMContentLoaded", () => {
    
    // Screens
    const screenIntro = document.getElementById("screen-intro");
    const screenWizard = document.getElementById("screen-wizard");
    const screenDashboard = document.getElementById("screen-dashboard");
    const appHeader = document.getElementById("app-header");

    // Wizard Variables
    let currentStep = 1;
    const totalSteps = 4;
    const wizardSteps = document.querySelectorAll(".wizard-step");
    const btnNext = document.getElementById("btnWizardNext");
    const btnPrev = document.getElementById("btnWizardPrev");
    const btnCalculate = document.getElementById("btnWizardCalculate");
    const progressBar = document.getElementById("wizard-progress-bar");
    const stepIndicators = document.querySelectorAll(".wizard-indicator");

    // Charts
    let mixPieChart = null;
    let latestMixResult = null;

    // ----- NAVIGATION & TRANSITIONS ----- //
    
    // Start Wizard from Intro
    document.getElementById("btnStartWizard").addEventListener("click", () => {
        screenIntro.classList.add("hidden");
        screenWizard.classList.remove("hidden");
        appHeader.classList.remove("hidden");
        updateWizardUI();
    });

    // Go Home (Reset)
    document.getElementById("btnGoHome").addEventListener("click", () => {
        screenDashboard.classList.add("hidden");
        screenWizard.classList.add("hidden");
        screenIntro.classList.remove("hidden");
        appHeader.classList.add("hidden");
        currentStep = 1;
        updateWizardUI();
    });

    // Wizard Next
    btnNext.addEventListener("click", () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateWizardUI();
        }
    });

    // Wizard Previous
    btnPrev.addEventListener("click", () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // Edit Inputs (from Dashboard)
    document.getElementById("btnEditInputs").addEventListener("click", () => {
        screenDashboard.classList.add("hidden");
        screenWizard.classList.remove("hidden");
    });

    function updateWizardUI() {
        // Show/Hide Steps
        wizardSteps.forEach((step, idx) => {
            if (idx + 1 === currentStep) {
                step.classList.add("active");
            } else {
                step.classList.remove("active");
            }
        });

        // Update Progress Bar
        const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPct}%`;

        // Update Indicators
        stepIndicators.forEach((ind, idx) => {
            const numDiv = ind.querySelector("div");
            const textSpan = ind.querySelector("span");
            if (idx + 1 <= currentStep) {
                numDiv.className = "w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(2,132,199,0.5)] border-4 border-slate-900 transition-colors";
                textSpan.className = "text-[10px] uppercase font-bold text-sky-400 mt-2 text-center absolute top-12 w-24 -ml-7";
            } else {
                numDiv.className = "w-10 h-10 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-bold border-4 border-slate-900 transition-colors";
                textSpan.className = "text-[10px] uppercase font-bold text-slate-500 mt-2 text-center absolute top-12 w-24 -ml-7";
            }
        });

        // Buttons state
        if (currentStep === 1) {
            btnPrev.classList.add("hidden");
        } else {
            btnPrev.classList.remove("hidden");
        }

        if (currentStep === totalSteps) {
            btnNext.classList.add("hidden");
            btnCalculate.classList.remove("hidden");
        } else {
            btnNext.classList.remove("hidden");
            btnCalculate.classList.add("hidden");
        }
    }

    // ----- LOGIC ----- //

    // Toggle custom S input
    document.getElementById("inputSDMode").addEventListener("change", (e) => {
        const customField = document.getElementById("inputCustomS");
        if (e.target.value === "custom") {
            customField.classList.remove("hidden");
        } else {
            customField.classList.add("hidden");
            customField.value = "";
        }
    });

    // Toggle SCM fields
    document.getElementById("inputUseSCM").addEventListener("change", (e) => {
        const scmFields = document.getElementById("scmFields");
        if (e.target.value === "true") {
            scmFields.classList.remove("hidden");
        } else {
            scmFields.classList.add("hidden");
        }
    });

    // Toggle Admixture fields
    document.getElementById("inputUseAdmix").addEventListener("change", (e) => {
        const wdInput = document.getElementById("inputWaterReductionPct");
        const dsInput = document.getElementById("inputAdmixDosagePct");
        if (e.target.value === "true") {
            wdInput.disabled = false;
            dsInput.disabled = false;
            wdInput.parentElement.classList.remove("opacity-50");
            dsInput.parentElement.classList.remove("opacity-50");
        } else {
            wdInput.disabled = true;
            dsInput.disabled = true;
            wdInput.parentElement.classList.add("opacity-50");
            dsInput.parentElement.classList.add("opacity-50");
        }
    });

    // Dashboard Tabs
    document.querySelectorAll(".nav-tab:not(#btnEditInputs)").forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active classes
            document.querySelectorAll(".nav-tab").forEach(t => {
                t.classList.remove("active", "text-sky-400", "border-sky-400");
                t.classList.add("text-slate-400", "border-transparent");
            });
            document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));

            // Add active class
            tab.classList.remove("text-slate-400", "border-transparent");
            tab.classList.add("active", "text-sky-400", "border-sky-400");
            const targetId = tab.getAttribute("data-tab");
            document.getElementById(targetId).classList.remove("hidden");
        });
    });

    // ----- CALCULATION ----- //
    
    btnCalculate.addEventListener("click", () => {
        const inputs = collectInputs();
        const res = IS10262Engine.calculateMix(inputs);
        latestMixResult = res;

        // Transition to Dashboard
        screenWizard.classList.add("hidden");
        screenDashboard.classList.remove("hidden");

        renderResults(res);
        renderSteps(res);
        renderBatching(res);
        renderReport(res);

        // Confetti if fully passed!
        if (res.cementitious.isWithinMax && res.cementitious.isGradeValid) {
            triggerConfetti();
        }
    });

    // Interactive batch volume adjustment in Dashboard
    document.getElementById("inputBatchVolume").addEventListener("input", (e) => {
        if (!latestMixResult) return;
        const inputs = collectInputs();
        inputs.batchVolume = parseFloat(e.target.value) || 0.05;
        const res = IS10262Engine.calculateMix(inputs);
        renderBatching(res);
    });

    function collectInputs() {
        return {
            fck: document.getElementById("inputFck").value,
            exposure: document.getElementById("inputExposure").value,
            structureType: document.getElementById("inputStructureType").value,
            slump: document.getElementById("inputSlump").value,
            isPumped: document.getElementById("inputIsPumped").value,
            customS: document.getElementById("inputSDMode").value === "custom" ? document.getElementById("inputCustomS").value : null,
            
            cementCurve: document.getElementById("inputCementCurve").value,
            sgOPC: document.getElementById("inputSgOPC").value,
            useSCM: document.getElementById("inputUseSCM").value,
            scmType: document.getElementById("inputScmType").value,
            scmPct: document.getElementById("inputScmPct").value,
            sgSCM: document.getElementById("inputSgSCM").value,

            msa: document.getElementById("inputMsa").value,
            zone: document.getElementById("inputZone").value,
            sgCA: document.getElementById("inputSgCA").value,
            sgFA: document.getElementById("inputSgFA").value,
            aggregateShape: document.getElementById("inputAggregateShape").value,
            ca1Fraction: document.getElementById("inputCa1Fraction").value,

            useAdmix: document.getElementById("inputUseAdmix").value,
            waterReductionPct: document.getElementById("inputWaterReductionPct").value,
            admixDosagePct: document.getElementById("inputAdmixDosagePct").value,

            faAbs: document.getElementById("inputFaAbs").value,
            faMois: document.getElementById("inputFaMois").value,
            ca1Abs: document.getElementById("inputCa1Abs").value,
            ca1Mois: document.getElementById("inputCa1Mois").value,
            ca2Abs: document.getElementById("inputCa2Abs").value,
            ca2Mois: document.getElementById("inputCa2Mois").value,
            
            batchVolume: document.getElementById("inputBatchVolume").value || 0.05
        };
    }

    function renderResults(res) {
        document.getElementById("resMixGrade").innerText = `M${res.inputs.fck} CONCRETE`;
        document.getElementById("resTargetStrength").innerText = `${res.targetStrength.targetStrength} MPa`;
        document.getElementById("resAdoptedWC").innerText = res.adoptedWC;
        document.getElementById("resMixRatio").innerText = res.ssdQuantities.ratio;

        const gradeBadge = document.getElementById("resGradeCheckBadge");
        if (!res.cementitious.isGradeValid) {
            gradeBadge.className = "bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm";
            gradeBadge.innerText = `INVALID GRADE (Min M${res.cementitious.minGrade}) ❌`;
        } else {
            gradeBadge.className = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm";
            gradeBadge.innerText = "GRADE PASS ✅";
        }

        const cemBadge = document.getElementById("resCementCheckBadge");
        if (!res.cementitious.isWithinMax) {
            cemBadge.className = "bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm";
            cemBadge.innerText = "MAX CEMENT EXCEEDED ⚠️";
        } else {
            cemBadge.className = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm";
            cemBadge.innerText = "CEMENT LIMIT PASS ✅";
        }

        // Table Rows
        const tbody = document.getElementById("resMixTable");
        let html = '';
        const rows = [
            { name: "Water", ssd: res.ssdQuantities.water, field: res.fieldQuantities.water },
            { name: "OPC Cement", ssd: res.ssdQuantities.opc, field: res.ssdQuantities.opc },
        ];
        
        if (res.inputs.useSCM === "true") {
            rows.push({ name: res.inputs.scmType, ssd: res.ssdQuantities.scm, field: res.ssdQuantities.scm });
        }
        
        rows.push(
            { name: "Fine Aggregate", ssd: res.ssdQuantities.fa, field: res.fieldQuantities.fa },
            { name: `Coarse Agg (${res.inputs.ca1Fraction}%)`, ssd: res.ssdQuantities.ca1, field: res.fieldQuantities.ca1 },
            { name: `Coarse Agg (${100 - res.inputs.ca1Fraction}%)`, ssd: res.ssdQuantities.ca2, field: res.fieldQuantities.ca2 },
        );

        if (res.inputs.useAdmix === "true") {
            rows.push({ name: "Chemical Admixture", ssd: res.ssdQuantities.admixture, field: res.ssdQuantities.admixture });
        }

        rows.forEach(r => {
            html += `
                <tr class="hover:bg-slate-800/50 transition">
                    <td class="p-3 font-semibold text-slate-200">${r.name}</td>
                    <td class="p-3 text-right">${r.ssd.toFixed(2)}</td>
                    <td class="p-3 text-right bg-blue-900/10 text-blue-300">${r.field.toFixed(2)}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        renderChart(res);
    }

    function renderChart(res) {
        const ctx = document.getElementById('chartMixPie').getContext('2d');
        if (mixPieChart) mixPieChart.destroy();

        const labels = ['Water', 'OPC', 'Fine Agg', 'Coarse Agg'];
        const data = [res.ssdQuantities.water, res.ssdQuantities.opc, res.ssdQuantities.fa, res.ssdQuantities.caTotal];
        const bgColors = ['#0284c7', '#475569', '#f59e0b', '#10b981'];

        if (res.inputs.useSCM === "true") {
            labels.push(res.inputs.scmType);
            data.push(res.ssdQuantities.scm);
            bgColors.push('#8b5cf6');
        }

        mixPieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#cbd5e1' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.raw;
                                const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((val * 100) / sum).toFixed(1);
                                return `${ctx.label}: ${val} kg (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderSteps(res) {
        const container = document.getElementById("stepsContainer");
        container.innerHTML = "";

        res.steps.forEach(step => {
            const valList = step.values.map(v => `<li class="mb-1 text-slate-300">• ${v}</li>`).join("");
            const noteHtml = step.note ? `<div class="mt-4 p-3 bg-slate-700/50 rounded border-l-4 border-amber-500 text-xs font-semibold text-amber-200">${step.note}</div>` : "";
            
            container.innerHTML += `
                <div class="p-6 bg-slate-900/60 rounded-xl border border-slate-700 hover:border-slate-500 transition relative overflow-hidden group">
                    <div class="absolute right-0 top-0 bg-slate-800 px-4 py-1 rounded-bl-xl border-b border-l border-slate-700 text-xs font-bold text-sky-500">Step ${step.step}</div>
                    
                    <h3 class="text-lg font-bold text-sky-400 mb-1 pr-16">${step.title}</h3>
                    <div class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">${step.clause}</div>
                    
                    <div class="mb-4 bg-slate-950 p-4 rounded-lg font-mono text-sm text-emerald-400 border border-slate-800 shadow-inner">
                        $$ ${step.formula.replace(/max/g, '\\max').replace(/min/g, '\\min')} $$
                    </div>
                    
                    <ul class="text-sm font-mono leading-relaxed mb-4">
                        ${valList}
                    </ul>
                    
                    <div class="bg-slate-800 text-sky-100 font-bold p-3 rounded text-sm text-center border border-slate-700 shadow-md">
                        Result: ${step.result}
                    </div>
                    
                    ${noteHtml}
                </div>
            `;
        });
        
        // Render Math equations if KaTeX is loaded
        if (typeof katex !== 'undefined') {
            document.querySelectorAll("#stepsContainer .font-mono").forEach(el => {
                if (el.innerText.includes("$$")) {
                    const math = el.innerText.replace(/\$\$/g, '');
                    katex.render(math, el, { throwOnError: false, displayMode: true });
                }
            });
        }
    }

    function renderBatching(res) {
        document.getElementById("lblBatchVolume").innerText = `${res.batchVolume} m³`;
        
        const tbody = document.getElementById("batchTable");
        let html = '';
        const rows = [
            { name: "Water", ssd: res.batchQuantities.waterSSD, field: res.batchQuantities.waterField },
            { name: "OPC Cement", ssd: res.batchQuantities.opc, field: res.batchQuantities.opc },
        ];
        
        if (res.inputs.useSCM === "true") {
            rows.push({ name: res.inputs.scmType, ssd: res.batchQuantities.scm, field: res.batchQuantities.scm });
        }
        
        rows.push(
            { name: "Fine Aggregate", ssd: res.batchQuantities.faSSD, field: res.batchQuantities.faField },
            { name: `Coarse Agg (${res.inputs.ca1Fraction}%)`, ssd: res.batchQuantities.ca1SSD, field: res.batchQuantities.ca1Field },
            { name: `Coarse Agg (${100 - res.inputs.ca1Fraction}%)`, ssd: res.batchQuantities.ca2SSD, field: res.batchQuantities.ca2Field },
        );

        if (res.inputs.useAdmix === "true") {
            rows.push({ name: "Chemical Admixture", ssd: res.batchQuantities.admixture, field: res.batchQuantities.admixture });
        }

        rows.forEach(r => {
            html += `
                <tr class="hover:bg-slate-800/50 transition border-b border-slate-700/60">
                    <td class="p-3">${r.name}</td>
                    <td class="p-3 text-right font-bold text-white">${r.ssd.toFixed(2)}</td>
                    <td class="p-3 text-right font-bold bg-blue-900/10 text-blue-300">${r.field.toFixed(2)}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        // Render Trial Mixes
        const tbodyTrial = document.getElementById("trialMixesTable");
        let trialHtml = '';
        res.trialMixes.forEach(t => {
            trialHtml += `
                <tr class="hover:bg-slate-800/50 transition border-b border-slate-700/60">
                    <td class="p-3 font-semibold text-sky-300">${t.name}</td>
                    <td class="p-3 font-bold">${t.wc.toFixed(3)}</td>
                    <td class="p-3 text-right">${t.water.toFixed(2)} kg</td>
                    <td class="p-3 text-right">${t.cementitious.toFixed(2)} kg</td>
                    <td class="p-3 text-xs text-slate-400 italic">${t.note}</td>
                </tr>
            `;
        });
        tbodyTrial.innerHTML = trialHtml;
    }

    function renderReport(res) {
        document.getElementById("reportDate").innerText = new Date().toLocaleDateString();
        
        document.getElementById("repFck").innerText = `M${res.inputs.fck}`;
        document.getElementById("repExposure").innerText = res.inputs.exposure;
        document.getElementById("repStructure").innerText = res.inputs.structureType;
        document.getElementById("repSlump").innerText = `${res.inputs.slump} mm`;
        document.getElementById("repPlacement").innerText = res.inputs.isPumped === "true" ? "Pumped" : "Non-Pumped";
        document.getElementById("repMsa").innerText = `${res.inputs.msa} mm`;

        const list = document.getElementById("reportSummaryList");
        list.innerHTML = `
            <li>Target Mean Strength: <strong>${res.targetStrength.targetStrength} N/mm²</strong></li>
            <li>Grade Compliance (IS 456 Table 5): <strong>${res.cementitious.isGradeValid ? 'PASS ✅' : `FAIL ❌ (Min M${res.cementitious.minGrade} required)`}</strong></li>
            <li>Adopted Free w/c Ratio: <strong>${res.adoptedWC}</strong></li>
            <li>Final Water Content: <strong>${res.water.final} kg/m³</strong></li>
            <li>Cementitious Content: <strong>${res.cementitious.adopted} kg/m³</strong> (Min: ${res.cementitious.minimum} kg/m³)</li>
            <li>OPC Max Limit Check (450 kg/m³): <strong>${res.cementitious.isWithinMax ? 'PASS ✅' : 'FAIL ⚠️'}</strong></li>
            <li>SSD Batch Mix Ratio (1 : FA : CA): <strong>${res.ssdQuantities.ratio}</strong></li>
            <li>Field Batch Mix Ratio: <strong>${res.fieldQuantities.ratio}</strong></li>
        `;

        const tbody = document.getElementById("reportMixTable");
        let html = '';
        const rows = [
            { name: "Water", ssd: res.ssdQuantities.water, field: res.fieldQuantities.water },
            { name: "OPC Cement", ssd: res.ssdQuantities.opc, field: res.ssdQuantities.opc },
        ];
        
        if (res.inputs.useSCM === "true") {
            rows.push({ name: res.inputs.scmType, ssd: res.ssdQuantities.scm, field: res.ssdQuantities.scm });
        }
        
        rows.push(
            { name: "Fine Aggregate", ssd: res.ssdQuantities.fa, field: res.fieldQuantities.fa },
            { name: `Coarse Agg (${res.inputs.ca1Fraction}%)`, ssd: res.ssdQuantities.ca1, field: res.fieldQuantities.ca1 },
            { name: `Coarse Agg (${100 - res.inputs.ca1Fraction}%)`, ssd: res.ssdQuantities.ca2, field: res.fieldQuantities.ca2 },
        );

        if (res.inputs.useAdmix === "true") {
            rows.push({ name: "Chemical Admixture", ssd: res.ssdQuantities.admixture, field: res.ssdQuantities.admixture });
        }

        rows.forEach(r => {
            html += `
                <tr>
                    <td class="p-2 border border-slate-300 font-sans font-semibold">${r.name}</td>
                    <td class="p-2 text-right border border-slate-300">${r.ssd.toFixed(2)}</td>
                    <td class="p-2 text-right border border-slate-300 bg-slate-100">${r.field.toFixed(2)}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    // Print Report
    document.getElementById("btnPrintBtn").addEventListener("click", () => {
        window.print();
    });

    // Helper: Confetti Celebration
    function triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0ea5e9', '#10b981', '#f59e0b']
            });
        }
    }

    // Load Presets (Annex A & B)
    document.getElementById("btnLoadAnnexA").addEventListener("click", () => {
        setInputValue("inputFck", "40");
        setInputValue("inputExposure", "Severe");
        setInputValue("inputStructureType", "RCC");
        setInputValue("inputSlump", "100");
        setInputValue("inputIsPumped", "true");
        setInputValue("inputSDMode", "auto");
        setInputValue("inputCementCurve", "Curve 2 (OPC 43)");
        setInputValue("inputSgOPC", "3.15");
        setInputValue("inputUseSCM", "false");
        setInputValue("inputMsa", "20");
        setInputValue("inputZone", "Zone I");
        setInputValue("inputSgCA", "2.74");
        setInputValue("inputSgFA", "2.74");
        setInputValue("inputAggregateShape", "Angular");
        setInputValue("inputCa1Fraction", "60");
        setInputValue("inputUseAdmix", "true");
        setInputValue("inputWaterReductionPct", "20");
        setInputValue("inputAdmixDosagePct", "1.0");
        setInputValue("inputFaAbs", "0");
        setInputValue("inputFaMois", "0");
        setInputValue("inputCa1Abs", "0");
        setInputValue("inputCa1Mois", "0");
        setInputValue("inputCa2Abs", "0");
        setInputValue("inputCa2Mois", "0");
        
        // Hide Intro, start wizard
        document.getElementById("btnStartWizard").click();
    });

    document.getElementById("btnLoadAnnexB").addEventListener("click", () => {
        document.getElementById("btnLoadAnnexA").click(); // Load base A
        setInputValue("inputUseSCM", "true");
        setInputValue("inputScmType", "Fly Ash");
        setInputValue("inputScmPct", "25"); // actually Annex B calculates it, but we set 30 or 25. Let's say 30% fly ash.
        setInputValue("inputScmPct", "30");
        setInputValue("inputSgSCM", "2.20");
        document.getElementById("inputUseSCM").dispatchEvent(new Event("change"));
    });

    function setInputValue(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
            el.dispatchEvent(new Event('change'));
        }
    }
});
