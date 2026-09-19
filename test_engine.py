"""
IS 10262:2019 Concrete Mix Design Engine & Verification Suite
"""

import math

def calculate_target_mean_strength(fck, custom_s=None):
    # Table 1: Value of X
    if fck in [10, 15]:
        X = 5.0
    elif fck in [20, 25]:
        X = 5.5
    elif 30 <= fck <= 60:
        X = 6.5
    else: # M65+
        X = 8.0

    # Table 2: Assumed Standard Deviation S
    if fck in [10, 15]:
        S_table = 3.5
    elif fck in [20, 25]:
        S_table = 4.0
    elif 30 <= fck <= 60:
        S_table = 5.0
    else: # M65 to M80
        S_table = 6.0

    S = custom_s if custom_s is not None else S_table

    fck_prime_1 = fck + 1.65 * S
    fck_prime_2 = fck + X
    target_strength = max(fck_prime_1, fck_prime_2)

    return {
        "fck": fck,
        "X": X,
        "S": S,
        "fck_prime_1": round(fck_prime_1, 2),
        "fck_prime_2": round(fck_prime_2, 2),
        "target_strength": round(target_strength, 2),
        "governing_formula": "fck + 1.65S" if fck_prime_1 >= fck_prime_2 else "fck + X"
    }

def get_max_wc_durability(exposure, structure_type="RCC"):
    durability_table = {
        "RCC": {"Mild": 0.55, "Moderate": 0.50, "Severe": 0.45, "Very Severe": 0.45, "Extreme": 0.40},
        "PCC": {"Mild": 0.60, "Moderate": 0.60, "Severe": 0.50, "Very Severe": 0.45, "Extreme": 0.40}
    }
    return durability_table.get(structure_type, {}).get(exposure, 0.45)

def get_min_cement_durability(exposure, structure_type="RCC"):
    durability_table = {
        "RCC": {"Mild": 300, "Moderate": 300, "Severe": 320, "Very Severe": 340, "Extreme": 360},
        "PCC": {"Mild": 220, "Moderate": 240, "Severe": 250, "Very Severe": 260, "Extreme": 280}
    }
    return durability_table.get(structure_type, {}).get(exposure, 300)

def get_min_grade_durability(exposure, structure_type="RCC"):
    durability_table = {
        "RCC": {"Mild": 20, "Moderate": 25, "Severe": 30, "Very Severe": 35, "Extreme": 40},
        "PCC": {"Mild": 10, "Moderate": 15, "Severe": 20, "Very Severe": 20, "Extreme": 25}
    }
    return durability_table.get(structure_type, {}).get(exposure, 30)

def get_air_content(msa):
    # Table 3
    air_table = {10: 1.5, 20: 1.0, 40: 0.8}
    return air_table.get(msa, 1.0)

def get_base_water_content(msa):
    # Table 4 (for 50mm slump, angular aggregate)
    water_table = {10: 208, 20: 186, 40: 165}
    return water_table.get(msa, 186)

def get_ca_proportion_base(msa, zone):
    # Table 5 (at w/c = 0.50)
    ca_table = {
        10: {"Zone I": 0.48, "Zone II": 0.50, "Zone III": 0.52, "Zone IV": 0.54},
        20: {"Zone I": 0.60, "Zone II": 0.62, "Zone III": 0.64, "Zone IV": 0.66},
        40: {"Zone I": 0.69, "Zone II": 0.71, "Zone III": 0.72, "Zone IV": 0.73}
    }
    return ca_table.get(msa, {}).get(zone, 0.62)

def run_mix_design(inputs):
    # 1. Target Strength
    ts_res = calculate_target_mean_strength(inputs["fck"], inputs.get("custom_s"))
    target_strength = ts_res["target_strength"]

    # 2. Water-Cement Ratio
    durability_wc = get_max_wc_durability(inputs["exposure"], inputs.get("structure_type", "RCC"))
    strength_wc = inputs.get("strength_wc", 0.40) # Can be input or interpolated from Fig 1
    adopted_wc = min(strength_wc, durability_wc)

    # 3. Air Content
    air_content_pct = get_air_content(inputs["msa"])
    v_air = air_content_pct / 100.0

    # 4. Water Content
    w_base = get_base_water_content(inputs["msa"])
    slump = inputs.get("slump", 50)
    slump_adj_pct = max(0, (slump - 50) / 25.0 * 3.0)
    w_slump_adj = w_base * (1.0 + slump_adj_pct / 100.0)

    # Aggregate shape adjustment
    shape_adj = inputs.get("shape_water_adj_kg", 0) # e.g. -10 kg for sub-angular
    w_shape_adj = w_slump_adj + shape_adj

    # Admixture water reduction
    water_reduction_pct = inputs.get("water_reduction_pct", 0)
    w_final = w_shape_adj * (1.0 - water_reduction_pct / 100.0)

    # 5. Cementitious Material Content
    c_calc = w_final / adopted_wc
    
    msa_val = inputs["msa"]
    min_cement_msa_adj = 40 if msa_val == 10 else (-30 if msa_val == 40 else 0)
    c_min = get_min_cement_durability(inputs["exposure"], inputs.get("structure_type", "RCC")) + min_cement_msa_adj
    c_adopted = max(c_calc, c_min)

    # SCM Breakdown
    scm_pct = inputs.get("scm_pct", 0)
    m_scm = c_adopted * (scm_pct / 100.0)
    m_opc = c_adopted * (1.0 - scm_pct / 100.0)

    # Check max cement limit (IS 456 Cl. 8.2.5 = 450 kg/m³ for OPC)
    c_max = inputs.get("max_cement_limit", 450)
    c_pass = m_opc <= c_max
    
    # Grade Validation
    min_grade = get_min_grade_durability(inputs["exposure"], inputs.get("structure_type", "RCC"))
    grade_pass = inputs["fck"] >= min_grade

    sg_opc = inputs.get("sg_opc", 3.15)
    sg_scm = inputs.get("sg_scm", 2.20)
    sg_water = inputs.get("sg_water", 1.0)
    
    # Admixture dosage
    admixture_dosage_pct = inputs.get("admixture_dosage_pct", 0) # % by weight of cementitious
    m_admixture = c_adopted * (admixture_dosage_pct / 100.0)
    sg_admixture = inputs.get("sg_admixture", 1.145)

    # 6. Coarse Aggregate & Fine Aggregate Proportions
    ca_base = get_ca_proportion_base(inputs["msa"], inputs["zone"])
    # Adjustment for w/c ratio (for every 0.05 decrease below 0.50, +0.01)
    wc_diff = 0.50 - adopted_wc
    ca_wc_adj = (wc_diff / 0.05) * 0.01
    ca_adj_wc = ca_base + ca_wc_adj

    # Pumping adjustment
    is_pumped = inputs.get("is_pumped", False)
    pump_red_pct = inputs.get("pumping_reduction_pct", 10.0 if is_pumped else 0.0)
    ca_final_prop = ca_adj_wc * (1.0 - pump_red_pct / 100.0)
    fa_final_prop = 1.0 - ca_final_prop

    # 7. Absolute Volume Calculations (per 1 m³)
    v_opc = m_opc / (sg_opc * 1000.0)
    v_scm = m_scm / (sg_scm * 1000.0) if scm_pct > 0 else 0.0
    v_water = w_final / (sg_water * 1000.0)
    v_admixture = m_admixture / (sg_admixture * 1000.0) if admixture_dosage_pct > 0 else 0.0

    v_cementitious = v_opc + v_scm
    v_agg_total = 1.0 - (v_cementitious + v_water + v_admixture + v_air)

    v_ca = v_agg_total * ca_final_prop
    v_fa = v_agg_total * fa_final_prop

    sg_ca = inputs.get("sg_ca", 2.74)
    sg_fa = inputs.get("sg_fa", 2.74)

    m_ca_ssd = v_ca * sg_ca * 1000.0
    m_fa_ssd = v_fa * sg_fa * 1000.0

    # Individual coarse aggregate fractions if specified
    ca_fractions = inputs.get("ca_fractions", {"CA1_20mm": 60, "CA2_10mm": 40})
    m_ca1_ssd = m_ca_ssd * (ca_fractions.get("CA1_20mm", 100) / 100.0)
    m_ca2_ssd = m_ca_ssd * (ca_fractions.get("CA2_10mm", 0) / 100.0)

    # 8. Field Batching Moisture Corrections
    fa_abs = inputs.get("fa_absorption_pct", 0.0)
    fa_mois = inputs.get("fa_moisture_pct", 0.0)
    ca1_abs = inputs.get("ca1_absorption_pct", 0.0)
    ca1_mois = inputs.get("ca1_moisture_pct", 0.0)
    ca2_abs = inputs.get("ca2_absorption_pct", 0.0)
    ca2_mois = inputs.get("ca2_moisture_pct", 0.0)

    # Free moisture % = moisture - absorption
    free_m_fa = fa_mois - fa_abs
    free_m_ca1 = ca1_mois - ca1_abs
    free_m_ca2 = ca2_mois - ca2_abs

    # Mass adjustments
    m_fa_field = m_fa_ssd * (1.0 + fa_mois / 100.0) / (1.0 + fa_abs / 100.0) if fa_abs > 0 else m_fa_ssd * (1.0 + free_m_fa / 100.0)
    m_ca1_field = m_ca1_ssd * (1.0 + ca1_mois / 100.0) / (1.0 + ca1_abs / 100.0) if ca1_abs > 0 else m_ca1_ssd * (1.0 + free_m_ca1 / 100.0)
    m_ca2_field = m_ca2_ssd * (1.0 + ca2_mois / 100.0) / (1.0 + ca2_abs / 100.0) if ca2_abs > 0 else m_ca2_ssd * (1.0 + free_m_ca2 / 100.0)
    m_ca_field_total = m_ca1_field + m_ca2_field

    # Water contribution from aggregates
    w_contrib_fa = m_fa_ssd * (free_m_fa / 100.0)
    w_contrib_ca1 = m_ca1_ssd * (free_m_ca1 / 100.0)
    w_contrib_ca2 = m_ca2_ssd * (free_m_ca2 / 100.0)
    w_contrib_total = w_contrib_fa + w_contrib_ca1 + w_contrib_ca2

    w_field = w_final - w_contrib_total

    # Proportions relative to Cementitious (1 : FA : CA)
    ratio_fa = m_fa_ssd / c_adopted
    ratio_ca = m_ca_ssd / c_adopted

    return {
        "target_strength": ts_res,
        "durability_wc": durability_wc,
        "strength_wc": strength_wc,
        "adopted_wc": round(adopted_wc, 3),
        "air_content_pct": air_content_pct,
        "base_water_kg": w_base,
        "slump_adj_water_kg": round(w_slump_adj, 2),
        "final_water_kg": round(w_final, 2),
        "c_calc_kg": round(c_calc, 2),
        "c_min_kg": c_min,
        "c_adopted_kg": round(c_adopted, 2),
        "c_max_kg": c_max,
        "c_pass": c_pass,
        "grade_pass": grade_pass,
        "min_grade": min_grade,
        "m_opc_kg": round(m_opc, 2),
        "m_scm_kg": round(m_scm, 2),
        "m_admixture_kg": round(m_admixture, 2),
        "ca_base_prop": ca_base,
        "ca_wc_adj_prop": round(ca_wc_adj, 3),
        "ca_final_prop": round(ca_final_prop, 3),
        "fa_final_prop": round(fa_final_prop, 3),
        "v_agg_total_m3": round(v_agg_total, 4),
        "m_ca_ssd_kg": round(m_ca_ssd, 2),
        "m_ca1_ssd_kg": round(m_ca1_ssd, 2),
        "m_ca2_ssd_kg": round(m_ca2_ssd, 2),
        "m_fa_ssd_kg": round(m_fa_ssd, 2),
        "m_fa_field_kg": round(m_fa_field, 2),
        "m_ca1_field_kg": round(m_ca1_field, 2),
        "m_ca2_field_kg": round(m_ca2_field, 2),
        "m_ca_field_total_kg": round(m_ca_field_total, 2),
        "w_field_kg": round(w_field, 2),
        "mix_ratio_ssd": f"1 : {ratio_fa:.2f} : {ratio_ca:.2f}",
        "mix_ratio_parts": {"cementitious": 1.0, "fa": round(ratio_fa, 2), "ca": round(ratio_ca, 2)}
    }

if __name__ == "__main__":
    print("--- TESTING ANNEX A (M40 OPC Mix) ---")
    annex_a_inputs = {
        "fck": 40,
        "exposure": "Severe",
        "msa": 20,
        "slump": 100,
        "zone": "Zone I",
        "strength_wc": 0.40,
        "water_reduction_pct": 20.0,
        "admixture_dosage_pct": 1.0,
        "sg_opc": 3.15,
        "sg_admixture": 1.145,
        "sg_ca": 2.74,
        "sg_fa": 2.74,
        "is_pumped": True,
        "pumping_reduction_pct": 10.0,
        "ca_fractions": {"CA1_20mm": 60, "CA2_10mm": 40}
    }
    res_a = run_mix_design(annex_a_inputs)
    for k, v in res_a.items():
        print(f"{k}: {v}")
