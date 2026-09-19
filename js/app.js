/**
 * IS 10262:2019 App Controller & UI Renderer
 */

document.addEventListener("DOMContentLoaded", () => {
    let currentCalculationResults = null;
    let chartInstance = null;

    // DOM Elements
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabContents = document.querySelectorAll(".tab-content");

    // Inputs
    const inputFck = document.getElementById("inputFck");
    const inputExposure = document.getElementById("inputExposure");
    const inputStructureType = document.getElementById("inputStructureType");
    const inputSlump = document.getElementById("inputSlump");
    const inputIsPumped = document.getElementById("inputIsPumped");
    const inputSDMode = document.getElementById("inputSDMode");
    const inputCustomS = document.getElementById("inputCustomS");

    const inputCementCurve = document.getElementById("inputCementCurve");
    const inputSgOPC = document.getElementById("inputSgOPC");
    const inputUseSCM = document.getElementById("inputUseSCM");
    const scmFields = document.getElementById("scmFields");
    const inputScmType = document.getElementById("inputScmType");
    const inputScmPct = document.getElementById("inputScmPct");
    const inputSgSCM = document.getElementById("inputSgSCM");

    const inputMsa = document.getElementById("inputMsa");
    const inputZone = document.getElementById("inputZone");
    const inputAggregateShape = document.getElementById("inputAggregateShape");
    const inputSgCA = document.getElementById("inputSgCA");
    const inputSgFA = document.getElementById("inputSgFA");
    const inputCa1Fraction = document.getElementById("inputCa1Fraction");

    const inputUseAdmix = document.getElementById("inputUseAdmix");
    const inputWaterReductionPct = document.getElementById("inputWaterReductionPct");
    const inputAdmixDosagePct = document.getElementById("inputAdmixDosagePct");

    const inputFaAbs = document.getElementById("inputFaAbs");
    const inputFaMois = document.getElementById("inputFaMois");
    const inputCa1Abs = document.getElementById("inputCa1Abs");
    const inputCa1Mois = document.getElementById("inputCa1Mois");
    const inputCa2Abs = document.getElementById("inputCa2Abs");
    const inputCa2Mois = document.getElementById("inputCa2Mois");

    const inputBatchVolume = document.getElementById("inputBatchVolume");

    // Action Buttons
    const btnLoadAnnexA = document.getElementById("btnLoadAnnexA");
    const btnLoadAnnexB = document.getElementById("btnLoadAnnexB");
    const btnPrintReport = document.getElementById("btnPrintReport");

    // Tab Navigation Event Listeners
    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-tab");
            
            navTabs.forEach(t => {
                t.classList.remove("active", "text-sky-400", "border-sky-400");
                t.classList.add("text-slate-400", "border-transparent");
            });
            tab.classList.add("active", "text-sky-400", "border-sky-400");
            tab.classList.remove("text-slate-400", "border-transparent");

            tabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove("hidden");
                } else {
                    content.classList.add("hidden");
                }
            });
        });
    });

    // Custom S input toggle
    inputSDMode.addEventListener("change", () => {
        if (inputSDMode.value === "custom") {
            inputCustomS.classList.remove("hidden");
        } else {
            inputCustomS.classList.add("hidden");
        }
        recalculate();
    });

    // SCM input toggle
    inputUseSCM.addEventListener("change", () => {
        if (inputUseSCM.value === "true") {
            scmFields.classList.remove("hidden");
        } else {
            scmFields.classList.add("hidden");
        }
        recalculate();
    });

    // Add recalculate listeners to all inputs
    const allInputs = [
        inputFck, inputExposure, inputStructureType, inputSlump, inputIsPumped, inputSDMode, inputCustomS,
        inputCementCurve, inputSgOPC, inputUseSCM, inputScmType, inputScmPct, inputSgSCM,
        inputMsa, inputZone, inputAggregateShape, inputSgCA, inputSgFA, inputCa1Fraction,
        inputUseAdmix, inputWaterReductionPct, inputAdmixDosagePct,
        inputFaAbs, inputFaMois, inputCa1Abs, inputCa1Mois, inputCa2Abs, inputCa2Mois,
        inputBatchVolume
    ];

    allInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", recalculate);
            input.addEventListener("change", recalculate);
        }
    });

    // Preset Loaders
    btnLoadAnnexA.addEventListener("click", () => {
        inputFck.value = "40";
        inputExposure.value = "Severe";
        inputStructureType.value = "RCC";
        inputSlump.value = "100";
        inputIsPumped.value = "true";
        inputSDMode.value = "auto";
        inputCustomS.classList.add("hidden");

        inputCementCurve.value = "Curve 3 (OPC 53)";
        inputSgOPC.value = "3.15";
        inputUseSCM.value = "false";
        scmFields.classList.add("hidden");

        inputMsa.value = "20";
        inputZone.value = "Zone I";
        inputAggregateShape.value = "Angular";
        inputSgCA.value = "2.74";
        inputSgFA.value = "2.74";
        inputCa1Fraction.value = "60";

        inputUseAdmix.value = "true";
        inputWaterReductionPct.value = "20";
        inputAdmixDosagePct.value = "1.0";

        inputFaAbs.value = "0";
        inputFaMois.value = "0";
        inputCa1Abs.value = "0";
        inputCa1Mois.value = "0";
        inputCa2Abs.value = "0";
        inputCa2Mois.value = "0";

        recalculate();
        showNotification("Loaded IS 10262 Annex A (M40 OPC Concrete) Preset!");
    });

    btnLoadAnnexB.addEventListener("click", () => {
        inputFck.value = "40";
        inputExposure.value = "Severe";
        inputStructureType.value = "RCC";
        inputSlump.value = "75";
        inputIsPumped.value = "true";
        inputSDMode.value = "auto";
        inputCustomS.classList.add("hidden");

        inputCementCurve.value = "Curve 3 (OPC 53)";
        inputSgOPC.value = "3.15";
        inputUseSCM.value = "true";
        scmFields.classList.remove("hidden");
        inputScmType.value = "Fly Ash";
        inputScmPct.value = "25";
        inputSgSCM.value = "2.20";

        inputMsa.value = "20";
        inputZone.value = "Zone I";
        inputAggregateShape.value = "Angular";
        inputSgCA.value = "2.74";
        inputSgFA.value = "2.74";
        inputCa1Fraction.value = "60";

        inputUseAdmix.value = "true";
        inputWaterReductionPct.value = "23";
        inputAdmixDosagePct.value = "1.0";

        inputFaAbs.value = "1.0";
        inputFaMois.value = "2.0";
        inputCa1Abs.value = "0.5";
        inputCa1Mois.value = "0.0";
        inputCa2Abs.value = "0.5";
        inputCa2Mois.value = "0.0";

        recalculate();
        showNotification("Loaded IS 10262 Annex B (M40 Fly Ash Concrete + Moisture) Preset!");
    });

    btnPrintReport.addEventListener("click", () => {
        // Trigger tab switch to report & window.print()
        document.querySelector('[data-tab="tab-report"]').click();
        setTimeout(() => {
            window.print();
        }, 300);
    });

    function recalculate() {
        const inputs = {
            fck: inputFck.value,
            customS: inputSDMode.value === "custom" ? inputCustomS.value : null,
            exposure: inputExposure.value,
            structureType: inputStructureType.value,
            slump: inputSlump.value,
            isPumped: inputIsPumped.value,
            cementCurve: inputCementCurve.value,
            sgOPC: inputSgOPC.value,
            useSCM: inputUseSCM.value,
            scmType: inputScmType.value,
            scmPct: inputScmPct.value,
            sgSCM: inputSgSCM.value,
            msa: inputMsa.value,
            zone: inputZone.value,
            aggregateShape: inputAggregateShape.value,
            sgCA: inputSgCA.value,
            sgFA: inputSgFA.value,
            ca1Fraction: inputCa1Fraction.value,
            useAdmix: inputUseAdmix.value,
            waterReductionPct: inputWaterReductionPct.value,
            admixDosagePct: inputAdmixDosagePct.value,
            faAbs: inputFaAbs.value,
            faMois: inputFaMois.value,
            ca1Abs: inputCa1Abs.value,
            ca1Mois: inputCa1Mois.value,
            ca2Abs: inputCa2Abs.value,
            ca2Mois: inputCa2Mois.value,
            batchVolume: inputBatchVolume.value
        };

        currentCalculationResults = IS10262Engine.calculateMix(inputs);
        renderResults(currentCalculationResults);
    }

    function renderResults(res) {
        // 1. Summary Card
        document.getElementById("resMixGrade").innerText = `M${res.inputs.fck} CONCRETE`;
        document.getElementById("resTargetStrength").innerText = `${res.targetStrength.targetStrength} N/mm²`;
        document.getElementById("resAdoptedWC").innerText = res.adoptedWC.toFixed(3);
        document.getElementById("resMixRatio").innerText = res.ssdQuantities.ratio;
        document.getElementById("resFieldWater").innerText = `${res.water.field} kg`;

        const badge = document.getElementById("resCementCheckBadge");
        if (!res.cementitious.isGradeValid) {
            badge.className = "bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold px-2.5 py-1 rounded-full";
            badge.innerText = `INVALID GRADE (Min M${res.cementitious.minGrade}) ❌`;
        } else if (!res.cementitious.isWithinMax) {
            badge.className = "bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold px-2.5 py-1 rounded-full";
            badge.innerText = "CEMENT LIMIT EXCEEDED ⚠️";
        } else {
            badge.className = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-2.5 py-1 rounded-full";
            badge.innerText = "IS COMPLIANT ✅";
        }

        // Table Rows
        const tbody = document.getElementById("resMixTable");
        tbody.innerHTML = `
            <tr>
                <td class="p-2.5 text-slate-300">OPC Cement</td>
                <td class="p-2.5 text-right font-bold text-sky-300">${res.ssdQuantities.opc}</td>
                <td class="p-2.5 text-right font-bold text-sky-300">${res.ssdQuantities.opc}</td>
            </tr>
            ${res.cementitious.scm > 0 ? `
            <tr>
                <td class="p-2.5 text-slate-300">${res.cementitious.scmType} (${res.cementitious.scmPct}%)</td>
                <td class="p-2.5 text-right font-bold text-cyan-300">${res.ssdQuantities.scm}</td>
                <td class="p-2.5 text-right font-bold text-cyan-300">${res.ssdQuantities.scm}</td>
            </tr>` : ''}
            <tr>
                <td class="p-2.5 text-slate-300">Mixing Water</td>
                <td class="p-2.5 text-right font-bold text-blue-300">${res.ssdQuantities.water}</td>
                <td class="p-2.5 text-right font-bold text-amber-300">${res.fieldQuantities.water}</td>
            </tr>
            <tr>
                <td class="p-2.5 text-slate-300">Fine Aggregate (${res.inputs.zone})</td>
                <td class="p-2.5 text-right font-bold text-emerald-300">${res.ssdQuantities.fa}</td>
                <td class="p-2.5 text-right font-bold text-emerald-300">${res.fieldQuantities.fa}</td>
            </tr>
            <tr>
                <td class="p-2.5 text-slate-300">Coarse Agg 20mm (${res.inputs.ca1Fraction}%)</td>
                <td class="p-2.5 text-right font-bold text-teal-300">${res.ssdQuantities.ca1}</td>
                <td class="p-2.5 text-right font-bold text-teal-300">${res.fieldQuantities.ca1}</td>
            </tr>
            <tr>
                <td class="p-2.5 text-slate-300">Coarse Agg 10mm (${100 - res.inputs.ca1Fraction}%)</td>
                <td class="p-2.5 text-right font-bold text-teal-300">${res.ssdQuantities.ca2}</td>
                <td class="p-2.5 text-right font-bold text-teal-300">${res.fieldQuantities.ca2}</td>
            </tr>
            ${res.ssdQuantities.admixture > 0 ? `
            <tr>
                <td class="p-2.5 text-slate-300">Chemical Admixture</td>
                <td class="p-2.5 text-right font-bold text-purple-300">${res.ssdQuantities.admixture}</td>
                <td class="p-2.5 text-right font-bold text-purple-300">${res.ssdQuantities.admixture}</td>
            </tr>` : ''}
        `;

        // 2. Render Pie Chart
        renderChart(res);

        // 3. Render Step-by-Step Breakdown
        renderSteps(res.steps);

        // 4. Render Batching & Trial Mixes
        renderBatching(res);

        // 5. Render Report View
        renderReport(res);
    }

    function renderChart(res) {
        const ctx = document.getElementById("chartMixPie").getContext("2d");
        if (chartInstance) {
            chartInstance.destroy();
        }

        const labels = ["OPC Cement", "Water", "Fine Aggregate", "Coarse Aggregate"];
        const data = [res.ssdQuantities.opc, res.ssdQuantities.water, res.ssdQuantities.fa, res.ssdQuantities.caTotal];
        const colors = ["#0284c7", "#3b82f6", "#10b981", "#0d9488"];

        if (res.ssdQuantities.scm > 0) {
            labels.splice(1, 0, res.cementitious.scmType);
            data.splice(1, 0, res.ssdQuantities.scm);
            colors.splice(1, 0, "#06b6d4");
        }

        if (res.ssdQuantities.admixture > 0) {
            labels.push("Admixture");
            data.push(res.ssdQuantities.admixture);
            colors.push("#a855f7");
        }

        chartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: "#0f172a"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { color: "#94a3b8", font: { size: 10 } }
                    }
                }
            }
        });
    }

    function renderSteps(steps) {
        const container = document.getElementById("stepsContainer");
        container.innerHTML = "";

        steps.forEach(st => {
            const card = document.createElement("div");
            card.className = "bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-md hover:border-sky-500/40 transition";

            card.innerHTML = `
                <div class="flex justify-between items-start mb-3 border-b border-slate-800 pb-3">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                            Step ${st.step}: ${st.clause}
                        </span>
                        <h3 class="text-base font-bold text-white mt-1">${st.title}</h3>
                    </div>
                    <span class="text-lg font-black text-amber-300 font-mono bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                        ${st.result}
                    </span>
                </div>

                <div class="space-y-2 text-xs font-mono text-slate-300">
                    <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sky-200">
                        <span class="text-slate-500 font-sans block mb-1 font-semibold">Standard Formula:</span>
                        <code>${st.formula}</code>
                    </div>

                    <div class="space-y-1 pt-1">
                        <span class="text-slate-400 font-sans block font-semibold">Calculation Breakdown:</span>
                        <ul class="list-disc list-inside space-y-1 text-slate-300 pl-1">
                            ${st.values.map(v => `<li>${v}</li>`).join('')}
                        </ul>
                    </div>

                    ${st.note ? `
                    <div class="mt-2 text-[11px] text-emerald-400 italic">
                        <i class="fa-solid fa-circle-info mr-1"></i> ${st.note}
                    </div>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    function renderBatching(res) {
        document.getElementById("lblBatchVolume").innerText = `${res.batchVolume} m³ / ${res.batchVolume * 1000} Liters`;

        const b = res.batchQuantities;
        const bTable = document.getElementById("batchTable");
        bTable.innerHTML = `
            <tr>
                <td class="p-3 font-medium">OPC Cement</td>
                <td class="p-3 text-right text-sky-300 font-bold">${b.opc} kg</td>
                <td class="p-3 text-right text-sky-300 font-bold">${b.opc} kg</td>
            </tr>
            ${b.scm > 0 ? `
            <tr>
                <td class="p-3 font-medium">${res.cementitious.scmType}</td>
                <td class="p-3 text-right text-cyan-300 font-bold">${b.scm} kg</td>
                <td class="p-3 text-right text-cyan-300 font-bold">${b.scm} kg</td>
            </tr>` : ''}
            <tr>
                <td class="p-3 font-medium">Mixing Water</td>
                <td class="p-3 text-right text-blue-300 font-bold">${b.waterSSD} kg</td>
                <td class="p-3 text-right text-amber-300 font-bold">${b.waterField} kg</td>
            </tr>
            <tr>
                <td class="p-3 font-medium">Fine Aggregate</td>
                <td class="p-3 text-right text-emerald-300 font-bold">${b.faSSD} kg</td>
                <td class="p-3 text-right text-emerald-300 font-bold">${b.faField} kg</td>
            </tr>
            <tr>
                <td class="p-3 font-medium">Coarse Aggregate 20mm</td>
                <td class="p-3 text-right text-teal-300 font-bold">${b.ca1SSD} kg</td>
                <td class="p-3 text-right text-teal-300 font-bold">${b.ca1Field} kg</td>
            </tr>
            <tr>
                <td class="p-3 font-medium">Coarse Aggregate 10mm</td>
                <td class="p-3 text-right text-teal-300 font-bold">${b.ca2SSD} kg</td>
                <td class="p-3 text-right text-teal-300 font-bold">${b.ca2Field} kg</td>
            </tr>
            ${b.admixture > 0 ? `
            <tr>
                <td class="p-3 font-medium">Chemical Admixture</td>
                <td class="p-3 text-right text-purple-300 font-bold">${b.admixture} kg</td>
                <td class="p-3 text-right text-purple-300 font-bold">${b.admixture} kg</td>
            </tr>` : ''}
        `;

        // Trial Mixes Table
        const tmTable = document.getElementById("trialMixesTable");
        tmTable.innerHTML = res.trialMixes.map(tm => `
            <tr>
                <td class="p-3 font-bold text-sky-400">${tm.name}</td>
                <td class="p-3 font-bold text-cyan-300">${tm.wc.toFixed(3)}</td>
                <td class="p-3 text-right font-bold text-blue-300">${tm.water.toFixed(1)}</td>
                <td class="p-3 text-right font-bold text-emerald-300">${tm.cementitious.toFixed(1)}</td>
                <td class="p-3 text-xs text-slate-400 font-sans">${tm.note}</td>
            </tr>
        `).join('');
    }

    function renderReport(res) {
        document.getElementById("repFck").innerText = `M${res.inputs.fck}`;
        document.getElementById("repExposure").innerText = res.inputs.exposure;
        document.getElementById("repStructure").innerText = res.inputs.structureType;
        document.getElementById("repSlump").innerText = `${res.inputs.slump} mm`;
        document.getElementById("repPlacement").innerText = res.inputs.isPumped ? "Pumped Concrete" : "Non-Pumped";
        document.getElementById("repMsa").innerText = `${res.inputs.msa} mm`;

        const list = document.getElementById("reportSummaryList");
        list.innerHTML = `
            <li>Target Mean Strength: <strong>${res.targetStrength.targetStrength} N/mm²</strong> (Formula: ${res.targetStrength.fck_prime_1 >= res.targetStrength.fck_prime_2 ? 'fck + 1.65S' : 'fck + X'})</li>
            <li>Grade Compliance: <strong>${res.cementitious.isGradeValid ? 'PASS ✅' : `FAIL ❌ (Min M${res.cementitious.minGrade} required)`}</strong></li>
            <li>Adopted Free w/c Ratio: <strong>${res.adoptedWC}</strong> (Max Durability Limit: ${res.durabilityLimits.max_wc})</li>
            <li>Final Water Content: <strong>${res.water.final} kg/m³</strong> (Slump Adj: +${((res.inputs.slump - 50)/25*3).toFixed(1)}%, Admix Red: -${res.inputs.waterReductionPct}%)</li>
            <li>Cementitious Content: <strong>${res.cementitious.adopted} kg/m³</strong> (Min Durability: ${res.durabilityLimits.min_cement} kg/m³, Max Limit Check: ${res.cementitious.isWithinMax ? 'PASS ✅' : 'FAIL ⚠️'})</li>
            <li>Coarse Aggregate Proportion: <strong>${(res.proportions.caFinalProp * 100).toFixed(2)}%</strong> | Fine Aggregate: <strong>${(res.proportions.faFinalProp * 100).toFixed(2)}%</strong></li>
            <li>SSD Batch Mix Ratio (1 : FA : CA): <strong>${res.ssdQuantities.ratio}</strong></li>
            <li>Field Batch Mix Ratio (Moisture Corrected): <strong>${res.fieldQuantities.ratio}</strong></li>
        `;

        const repTable = document.getElementById("reportMixTable");
        repTable.innerHTML = `
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">OPC Cement</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.opc}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.opc}</td>
            </tr>
            ${res.ssdQuantities.scm > 0 ? `
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">${res.cementitious.scmType}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.scm}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.scm}</td>
            </tr>` : ''}
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">Water</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.water}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.fieldQuantities.water}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">Fine Aggregate</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.fa}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.fieldQuantities.fa}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">Coarse Aggregate (20mm)</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.ca1}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.fieldQuantities.ca1}</td>
            </tr>
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">Coarse Aggregate (10mm)</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.ca2}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.fieldQuantities.ca2}</td>
            </tr>
            ${res.ssdQuantities.admixture > 0 ? `
            <tr>
                <td class="p-2 border border-slate-700 print:border-slate-300 font-semibold">Chemical Admixture</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.admixture}</td>
                <td class="p-2 text-right border border-slate-700 print:border-slate-300 font-bold">${res.ssdQuantities.admixture}</td>
            </tr>` : ''}
        `;
    }

    function showNotification(msg) {
        const toast = document.createElement("div");
        toast.className = "fixed bottom-5 right-5 bg-sky-600 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-2xl z-50 transition transform translate-y-0";
        toast.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Initial Calculation
    recalculate();
});
