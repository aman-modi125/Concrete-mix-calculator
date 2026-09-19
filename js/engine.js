/**
 * IS 10262:2019 Concrete Mix Design Engine
 * Fully compliant with Indian Standard IS 10262:2019 Guidelines for Concrete Mix Proportioning
 */

const IS10262Engine = {
    // Table 1: Value of X (N/mm²)
    getTable1_X(fck) {
        if (fck <= 15) return 5.0;
        if (fck <= 25) return 5.5;
        if (fck <= 60) return 6.5;
        return 8.0;
    },

    // Table 2: Assumed Standard Deviation S (N/mm²)
    getTable2_S(fck) {
        if (fck <= 15) return 3.5;
        if (fck <= 25) return 4.0;
        if (fck <= 60) return 5.0;
        return 6.0;
    },

    // IS 456 Table 5 / IS 10262 Table 4 & 5 Durability Requirements
    getDurabilityLimits(exposure, structureType = "RCC") {
        const limits = {
            RCC: {
                Mild: { max_wc: 0.55, min_cement: 300, min_grade: 20 },
                Moderate: { max_wc: 0.50, min_cement: 300, min_grade: 25 },
                Severe: { max_wc: 0.45, min_cement: 320, min_grade: 30 },
                "Very Severe": { max_wc: 0.45, min_cement: 340, min_grade: 35 },
                Extreme: { max_wc: 0.40, min_cement: 360, min_grade: 40 }
            },
            PCC: {
                Mild: { max_wc: 0.60, min_cement: 220, min_grade: 10 },
                Moderate: { max_wc: 0.60, min_cement: 240, min_grade: 15 },
                Severe: { max_wc: 0.50, min_cement: 250, min_grade: 20 },
                "Very Severe": { max_wc: 0.45, min_cement: 260, min_grade: 20 },
                Extreme: { max_wc: 0.40, min_cement: 280, min_grade: 25 }
            }
        };
        return limits[structureType]?.[exposure] || { max_wc: 0.45, min_cement: 320, min_grade: 30 };
    },

    // Table 3: Approximate Air Content (% of Volume of Concrete)
    getTable3_AirContent(msa) {
        const airMap = { 10: 1.5, 20: 1.0, 40: 0.8 };
        return airMap[msa] || 1.0;
    },

    // Table 4: Water Content per m³ for 50 mm Slump & Angular Aggregates
    getTable4_BaseWater(msa) {
        const waterMap = { 10: 208, 20: 186, 40: 165 };
        return waterMap[msa] || 186;
    },

    // Table 5: Volume of Coarse Aggregate per Unit Volume of Total Aggregate for w/c = 0.50
    getTable5_CABase(msa, zone) {
        const caMap = {
            10: { "Zone I": 0.48, "Zone II": 0.50, "Zone III": 0.52, "Zone IV": 0.54 },
            20: { "Zone I": 0.60, "Zone II": 0.62, "Zone III": 0.64, "Zone IV": 0.66 },
            40: { "Zone I": 0.69, "Zone II": 0.71, "Zone III": 0.72, "Zone IV": 0.73 }
        };
        return caMap[msa]?.[zone] || 0.62;
    },

    /**
     * Estimates preliminary strength-based w/c from IS 10262:2019 Figure 1
     * Curve 1: OPC 33 / PPC, Curve 2: OPC 43, Curve 3: OPC 53
     */
    estimateStrengthWC(targetStrength, cementCurve = "Curve 3 (OPC 53)") {
        let baseWC = 0.40;
        if (targetStrength >= 65) baseWC = 0.28;
        else if (targetStrength >= 55) baseWC = 0.33;
        else if (targetStrength >= 48) baseWC = 0.38;
        else if (targetStrength >= 40) baseWC = 0.43;
        else if (targetStrength >= 30) baseWC = 0.50;
        else baseWC = 0.58;

        if (cementCurve.includes("Curve 1")) baseWC += 0.04;
        else if (cementCurve.includes("Curve 2")) baseWC += 0.02;

        return Math.min(Math.max(baseWC, 0.25), 0.60);
    },

    /**
     * Main Mix Design Calculator Function
     * @param {Object} inputs 
     * @returns {Object} Full calculation output with step-by-step audit log
     */
    calculateMix(inputs) {
        const steps = [];
        const fck = parseFloat(inputs.fck) || 40;
        const customS = inputs.customS ? parseFloat(inputs.customS) : null;
        const msa = parseInt(inputs.msa) || 20;
        const exposure = inputs.exposure || "Severe";
        const structureType = inputs.structureType || "RCC";
        const slump = parseFloat(inputs.slump) || 100;
        const isPumped = inputs.isPumped === true || inputs.isPumped === "true";
        const zone = inputs.zone || "Zone I";
        const aggregateShape = inputs.aggregateShape || "Angular";
        
        // Materials Specific Gravity
        const sgOPC = parseFloat(inputs.sgOPC) || 3.15;
        const useSCM = inputs.useSCM === true || inputs.useSCM === "true";
        const scmType = inputs.scmType || "Fly Ash";
        const scmPct = useSCM ? (parseFloat(inputs.scmPct) || 0) : 0;
        const sgSCM = parseFloat(inputs.sgSCM) || (scmType === "Fly Ash" ? 2.20 : 2.80);
        
        const sgFA = parseFloat(inputs.sgFA) || 2.74;
        const sgCA = parseFloat(inputs.sgCA) || 2.74;
        const sgWater = 1.0;
        
        // Chemical Admixture
        const useAdmix = inputs.useAdmix === true || inputs.useAdmix === "true";
        const admixType = inputs.admixType || "Superplasticizer";
        const admixDosagePct = useAdmix ? (parseFloat(inputs.admixDosagePct) || 0) : 0;
        const waterReductionPct = useAdmix ? (parseFloat(inputs.waterReductionPct) || 0) : 0;
        const sgAdmix = parseFloat(inputs.sgAdmix) || 1.145;

        // Coarse aggregate fraction split
        const ca1Fraction = parseFloat(inputs.ca1Fraction) || 60; // e.g. 20mm
        const ca2Fraction = 100 - ca1Fraction; // e.g. 10mm

        // Field moisture & absorption
        const faAbs = parseFloat(inputs.faAbs) || 0;
        const faMois = parseFloat(inputs.faMois) || 0;
        const ca1Abs = parseFloat(inputs.ca1Abs) || 0;
        const ca1Mois = parseFloat(inputs.ca1Mois) || 0;
        const ca2Abs = parseFloat(inputs.ca2Abs) || 0;
        const ca2Mois = parseFloat(inputs.ca2Mois) || 0;

        // Custom batching volume (m³)
        const batchVolume = parseFloat(inputs.batchVolume) || 1.0;

        // STEP 1: TARGET MEAN STRENGTH
        const X = this.getTable1_X(fck);
        const S = customS !== null ? customS : this.getTable2_S(fck);
        const fck_prime_1 = fck + 1.65 * S;
        const fck_prime_2 = fck + X;
        const targetStrength = Math.max(fck_prime_1, fck_prime_2);

        steps.push({
            step: 1,
            title: "Target Mean Compressive Strength (f'ck)",
            clause: "IS 10262:2019 Clause 4.2",
            formula: "f'ck = max(fck + 1.65 × S, fck + X)",
            values: [
                `fck = ${fck} N/mm²`,
                `Standard Deviation (S) = ${S} N/mm² (Table 2)`,
                `Factor X = ${X} N/mm² (Table 1)`,
                `Formula A (fck + 1.65S) = ${fck} + 1.65 × ${S} = ${fck_prime_1.toFixed(2)} N/mm²`,
                `Formula B (fck + X) = ${fck} + ${X} = ${fck_prime_2.toFixed(2)} N/mm²`
            ],
            result: `${targetStrength.toFixed(2)} N/mm²`,
            note: fck_prime_1 >= fck_prime_2 ? "Governed by fck + 1.65S" : "Governed by fck + X"
        });

        // STEP 2: SELECTION OF WATER-CEMENT RATIO (w/c)
        const durabilityLimits = this.getDurabilityLimits(exposure, structureType);
        const maxWCDurability = durabilityLimits.max_wc;
        const estimatedStrengthWC = inputs.manualWC ? parseFloat(inputs.manualWC) : this.estimateStrengthWC(targetStrength, inputs.cementCurve);
        const adoptedWC = Math.min(estimatedStrengthWC, maxWCDurability);

        steps.push({
            step: 2,
            title: "Selection of Free Water-Cement / Water-Cementitious Ratio (w/c)",
            clause: "IS 10262:2019 Clause 4.3 & IS 456:2000 Table 5",
            formula: "Adopted w/c = min(Strength-based w/c, Durability Max w/c)",
            values: [
                `Strength-based w/c (Fig 1 curve) = ${estimatedStrengthWC.toFixed(3)}`,
                `Max Permissible w/c for ${exposure} exposure (${structureType}) = ${maxWCDurability.toFixed(2)}`
            ],
            result: adoptedWC.toFixed(3),
            note: adoptedWC === maxWCDurability ? "Governed by Durability Limit" : "Governed by Target Strength"
        });

        // STEP 3: AIR CONTENT
        const airContentPct = this.getTable3_AirContent(msa);
        const vAir = airContentPct / 100.0;

        steps.push({
            step: 3,
            title: "Estimation of Air Content",
            clause: "IS 10262:2019 Table 3 (Clause 4.4)",
            formula: "Air Content % based on Maximum Nominal Size of Aggregate",
            values: [`Max Nominal Aggregate Size = ${msa} mm`],
            result: `${airContentPct}% (Volume = ${vAir.toFixed(3)} m³)`
        });

        // STEP 4: SELECTION OF WATER CONTENT
        const baseWater = this.getTable4_BaseWater(msa);
        const slumpDiff = slump - 50;
        const slumpAdjPct = slumpDiff > 0 ? (slumpDiff / 25.0) * 3.0 : 0;
        const wSlumpAdj = baseWater * (1.0 + slumpAdjPct / 100.0);

        let shapeAdjKg = 0;
        if (aggregateShape === "Sub-angular") shapeAdjKg = -10;
        else if (aggregateShape === "Gravel (Uncrushed)") shapeAdjKg = -15;

        const wShapeAdj = wSlumpAdj + shapeAdjKg;
        const wFinal = wShapeAdj * (1.0 - waterReductionPct / 100.0);

        steps.push({
            step: 4,
            title: "Selection of Water Content & Adjustments",
            clause: "IS 10262:2019 Table 4 (Clause 4.5)",
            formula: "W_final = [W_base × (1 + SlumpAdj%) + ShapeAdj] × (1 - WaterRed%)",
            values: [
                `Base Water Content (50mm slump, 20mm MSA) = ${baseWater} kg/m³`,
                `Slump Adjustment (${slump} mm slump) = +${slumpAdjPct.toFixed(1)}% -> ${wSlumpAdj.toFixed(2)} kg/m³`,
                `Aggregate Shape Adjustment (${aggregateShape}) = ${shapeAdjKg} kg/m³`,
                `Chemical Admixture Water Reduction = -${waterReductionPct}%`
            ],
            result: `${wFinal.toFixed(2)} kg/m³`
        });

        // STEP 5: CEMENTITIOUS MATERIAL CONTENT
        const cCalc = wFinal / adoptedWC;
        
        // IS 456 Table 6: Adjustment to minimum cement content for aggregate size
        let minCementMSAAdjustment = 0;
        if (msa === 10) minCementMSAAdjustment = 40;
        else if (msa === 40) minCementMSAAdjustment = -30;
        
        const minCementDurability = durabilityLimits.min_cement + minCementMSAAdjustment;
        const cAdopted = Math.max(cCalc, minCementDurability);
        const mSCM = cAdopted * (scmPct / 100.0);
        const mOPC = cAdopted - mSCM;
        const mAdmix = cAdopted * (admixDosagePct / 100.0);

        const maxCementLimit = 450; // IS 456 Cl. 8.2.5 (Applies to cement, excluding SCM)
        const isCementWithinMax = mOPC <= maxCementLimit;

        // Grade Validation check
        const minGradeDurability = durabilityLimits.min_grade;
        const isGradeValid = fck >= minGradeDurability;

        steps.push({
            step: 5,
            title: "Calculation of Cementitious Material Content & Validation",
            clause: "IS 10262:2019 Clause 4.6 & IS 456 Table 5 & 6",
            formula: "Cementitious Content = max(Water / (w/c), Min Durability Requirement)",
            values: [
                `Concrete Grade M${fck} vs Min Grade M${minGradeDurability} for ${exposure} ${structureType} (Status: ${isGradeValid ? "PASS ✅" : "FAIL ❌"})`,
                `Calculated Cementitious Content = ${wFinal.toFixed(2)} / ${adoptedWC.toFixed(3)} = ${cCalc.toFixed(2)} kg/m³`,
                `Minimum Required Cementitious Content (${exposure}, ${structureType}, ${msa}mm MSA) = ${durabilityLimits.min_cement} + (${minCementMSAAdjustment}) = ${minCementDurability} kg/m³`,
                `Adopted Cementitious Content = ${cAdopted.toFixed(2)} kg/m³`,
                useSCM ? `${scmType} Replacement (${scmPct}%) = ${mSCM.toFixed(2)} kg/m³, OPC = ${mOPC.toFixed(2)} kg/m³` : "100% OPC Cement",
                `IS 456 Max Cement (OPC) Limit = 450 kg/m³ (Calculated OPC = ${mOPC.toFixed(2)} kg/m³ -> Status: ${isCementWithinMax ? "PASS ✅" : "EXCEEDED ⚠️"})`
            ],
            result: `${cAdopted.toFixed(2)} kg/m³ (OPC: ${mOPC.toFixed(2)} kg, ${useSCM ? scmType : "SCM"}: ${mSCM.toFixed(2)} kg)`
        });

        // STEP 6: COARSE & FINE AGGREGATE PROPORTIONS
        const caBaseProp = this.getTable5_CABase(msa, zone);
        // Adjustment for w/c: for every 0.05 decrease in w/c below 0.50, +0.01
        const wcDiff = 0.50 - adoptedWC;
        const caWCAdj = (wcDiff / 0.05) * 0.01;
        const caAdjWC = caBaseProp + caWCAdj;

        // Pumping adjustment: reduce CA fraction by 10% for pumped concrete
        const pumpingReductionPct = isPumped ? 10.0 : 0.0;
        const caFinalProp = caAdjWC * (1.0 - pumpingReductionPct / 100.0);
        const faFinalProp = 1.0 - caFinalProp;

        steps.push({
            step: 6,
            title: "Coarse & Fine Aggregate Proportions",
            clause: "IS 10262:2019 Table 5 (Clause 4.7)",
            formula: "CA_prop = [CA_base + ((0.50 - w/c)/0.05) × 0.01] × (1 - PumpRed%)",
            values: [
                `Base Coarse Aggregate Proportion (MSA ${msa}mm, ${zone} @ w/c=0.50) = ${caBaseProp}`,
                `Adjustment for w/c (${adoptedWC.toFixed(3)}) = +${caWCAdj.toFixed(3)}`,
                `Pumpability Adjustment (${isPumped ? "Pumped Concrete, -10%" : "Non-pumped"}) = ${pumpingReductionPct}%`,
                `Final Coarse Aggregate Volume Fraction (V_CA) = ${caFinalProp.toFixed(4)}`,
                `Final Fine Aggregate Volume Fraction (V_FA) = ${faFinalProp.toFixed(4)}`
            ],
            result: `CA = ${(caFinalProp * 100).toFixed(2)}%, FA = ${(faFinalProp * 100).toFixed(2)}%`
        });

        // STEP 7: ABSOLUTE VOLUME CALCULATIONS (Per 1 m³)
        const vOPC = mOPC / (sgOPC * 1000.0);
        const vSCM = useSCM ? mSCM / (sgSCM * 1000.0) : 0.0;
        const vWater = wFinal / (sgWater * 1000.0);
        const vAdmix = useAdmix ? mAdmix / (sgAdmix * 1000.0) : 0.0;
        const vCementitious = vOPC + vSCM;

        const vAggTotal = 1.0 - (vCementitious + vWater + vAdmix + vAir);
        const vCA = vAggTotal * caFinalProp;
        const vFA = vAggTotal * faFinalProp;

        const mCASSD = vCA * sgCA * 1000.0;
        const mFASSD = vFA * sgFA * 1000.0;

        const mCA1SSD = mCASSD * (ca1Fraction / 100.0);
        const mCA2SSD = mCASSD * (ca2Fraction / 100.0);

        steps.push({
            step: 7,
            title: "Absolute Volume & SSD Mix Proportions",
            clause: "IS 10262:2019 Clause 5.3 & Worked Examples",
            formula: "V_agg = 1.0 - (V_cement + V_SCM + V_water + V_admix + V_air)",
            values: [
                `V_cementitious = ${vCementitious.toFixed(4)} m³ (OPC: ${vOPC.toFixed(4)} m³, SCM: ${vSCM.toFixed(4)} m³)`,
                `V_water = ${vWater.toFixed(4)} m³, V_admixture = ${vAdmix.toFixed(5)} m³, V_air = ${vAir.toFixed(3)} m³`,
                `Net Aggregate Volume (V_agg) = ${vAggTotal.toFixed(4)} m³`,
                `V_CA = ${vCA.toFixed(4)} m³, V_FA = ${vFA.toFixed(4)} m³`
            ],
            result: `OPC=${mOPC.toFixed(2)}kg, ${useSCM ? scmType : 'SCM'}=${mSCM.toFixed(2)}kg, Water=${wFinal.toFixed(2)}kg, FA=${mFASSD.toFixed(2)}kg, CA=${mCASSD.toFixed(2)}kg`
        });

        // STEP 8: FIELD BATCHING MOISTURE CORRECTIONS
        // Free moisture % = moisture - absorption
        const freeMFA = faMois - faAbs;
        const freeMCA1 = ca1Mois - ca1Abs;
        const freeMCA2 = ca2Mois - ca2Abs;

        const mFAField = mFASSD * (1.0 + freeMFA / 100.0);
        const mCA1Field = mCA1SSD * (1.0 + freeMCA1 / 100.0);
        const mCA2Field = mCA2SSD * (1.0 + freeMCA2 / 100.0);
        const mCAFieldTotal = mCA1Field + mCA2Field;

        const wContribFA = mFASSD * (freeMFA / 100.0);
        const wContribCA1 = mCA1SSD * (freeMCA1 / 100.0);
        const wContribCA2 = mCA2SSD * (freeMCA2 / 100.0);
        const wContribTotal = wContribFA + wContribCA1 + wContribCA2;

        const wField = wFinal - wContribTotal;

        steps.push({
            step: 8,
            title: "Field Moisture & Absorption Corrections",
            clause: "IS 10262:2019 Annex B & Field Batching Guidelines",
            formula: "Free Moisture = Moisture% - Absorption%, W_field = W_final - Σ(Aggregate Free Water)",
            values: [
                `Fine Agg: Abs=${faAbs}%, Mois=${faMois}% -> Free Moisture = ${freeMFA.toFixed(2)}%`,
                `CA Fraction 1 (${ca1Fraction}%): Abs=${ca1Abs}%, Mois=${ca1Mois}% -> Free Moisture = ${freeMCA1.toFixed(2)}%`,
                `CA Fraction 2 (${ca2Fraction}%): Abs=${ca2Abs}%, Mois=${ca2Mois}% -> Free Moisture = ${freeMCA2.toFixed(2)}%`,
                `Aggregate Water Contribution = ${wContribTotal.toFixed(2)} kg/m³`
            ],
            result: `Field Water = ${wField.toFixed(2)} kg/m³, Field FA = ${mFAField.toFixed(2)} kg/m³, Field CA = ${mCAFieldTotal.toFixed(2)} kg/m³`
        });

        // Mix Ratio (1 : FA : CA)
        const ratioFA = mFASSD / cAdopted;
        const ratioCA = mCASSD / cAdopted;
        const ratioFieldFA = mFAField / cAdopted;
        const ratioFieldCA = mCAFieldTotal / cAdopted;

        // Custom Batch Scaling (e.g. for laboratory batch 0.05 m³)
        const batchScale = batchVolume;
        const batch = {
            opc: mOPC * batchScale,
            scm: mSCM * batchScale,
            cementitious: cAdopted * batchScale,
            waterSSD: wFinal * batchScale,
            waterField: wField * batchScale,
            faSSD: mFASSD * batchScale,
            faField: mFAField * batchScale,
            ca1SSD: mCA1SSD * batchScale,
            ca1Field: mCA1Field * batchScale,
            ca2SSD: mCA2SSD * batchScale,
            ca2Field: mCA2Field * batchScale,
            caSSDTotal: mCASSD * batchScale,
            caFieldTotal: mCAFieldTotal * batchScale,
            admixture: mAdmix * batchScale
        };

        // Trial Mixes Setup (Trial Mix 1-4)
        const trialMixes = [
            { id: 1, name: "Trial Mix 1 (Initial Calculated Mix)", wc: adoptedWC, water: wFinal, cementitious: cAdopted, fa: mFASSD, ca: mCASSD, slumpTarget: slump, note: "Check workability, bleeding, segregation" },
            { id: 2, name: "Trial Mix 2 (Water/Admix Adjusted)", wc: adoptedWC, water: wFinal * 1.03, cementitious: (wFinal * 1.03) / adoptedWC, fa: mFASSD, ca: mCASSD, slumpTarget: slump, note: "If workability is low (+3% water adjustment)" },
            { id: 3, name: "Trial Mix 3 (-10% w/c Variation)", wc: adoptedWC * 0.90, water: wFinal, cementitious: wFinal / (adoptedWC * 0.90), fa: mFASSD, ca: mCASSD, slumpTarget: slump, note: "Compressive strength curve verification (-10% w/c)" },
            { id: 4, name: "Trial Mix 4 (+10% w/c Variation)", wc: adoptedWC * 1.10, water: wFinal, cementitious: wFinal / (adoptedWC * 1.10), fa: mFASSD, ca: mCASSD, slumpTarget: slump, note: "Compressive strength curve verification (+10% w/c)" }
        ];

        return {
            inputs,
            targetStrength: {
                fck,
                S,
                X,
                fck_prime_1: round(fck_prime_1, 2),
                fck_prime_2: round(fck_prime_2, 2),
                targetStrength: round(targetStrength, 2)
            },
            durabilityLimits,
            adoptedWC: round(adoptedWC, 3),
            airContentPct,
            water: {
                base: baseWater,
                slumpAdj: round(wSlumpAdj, 2),
                shapeAdjKg,
                waterReductionPct,
                final: round(wFinal, 2),
                field: round(wField, 2),
                contribNet: round(wContribTotal, 2)
            },
            cementitious: {
                calculated: round(cCalc, 2),
                minimum: minCementDurability,
                adopted: round(cAdopted, 2),
                maximum: maxCementLimit,
                isWithinMax: isCementWithinMax,
                isGradeValid: isGradeValid,
                minGrade: minGradeDurability,
                opc: round(mOPC, 2),
                scm: round(mSCM, 2),
                scmType,
                scmPct,
                admixture: round(mAdmix, 2)
            },
            proportions: {
                caBase: caBaseProp,
                caWCAdj: round(caWCAdj, 4),
                pumpingReductionPct,
                caFinalProp: round(caFinalProp, 4),
                faFinalProp: round(faFinalProp, 4)
            },
            ssdQuantities: {
                opc: round(mOPC, 2),
                scm: round(mSCM, 2),
                cementitious: round(cAdopted, 2),
                water: round(wFinal, 2),
                fa: round(mFASSD, 2),
                ca1: round(mCA1SSD, 2),
                ca2: round(mCA2SSD, 2),
                caTotal: round(mCASSD, 2),
                admixture: round(mAdmix, 2),
                ratio: `1 : ${round(ratioFA, 2)} : ${round(ratioCA, 2)}`
            },
            fieldQuantities: {
                fa: round(mFAField, 2),
                ca1: round(mCA1Field, 2),
                ca2: round(mCA2Field, 2),
                caTotal: round(mCAFieldTotal, 2),
                water: round(wField, 2),
                ratio: `1 : ${round(ratioFieldFA, 2)} : ${round(ratioFieldCA, 2)}`
            },
            batchVolume,
            batchQuantities: {
                opc: round(batch.opc, 2),
                scm: round(batch.scm, 2),
                cementitious: round(batch.cementitious, 2),
                waterSSD: round(batch.waterSSD, 2),
                waterField: round(batch.waterField, 2),
                faSSD: round(batch.faSSD, 2),
                faField: round(batch.faField, 2),
                ca1SSD: round(batch.ca1SSD, 2),
                ca1Field: round(batch.ca1Field, 2),
                ca2SSD: round(batch.ca2SSD, 2),
                ca2Field: round(batch.ca2Field, 2),
                caSSDTotal: round(batch.caSSDTotal, 2),
                caFieldTotal: round(batch.caFieldTotal, 2),
                admixture: round(batch.admixture, 3)
            },
            trialMixes,
            steps
        };
    }
};

function round(val, decimals = 2) {
    return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Export module for browser or node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IS10262Engine;
}
