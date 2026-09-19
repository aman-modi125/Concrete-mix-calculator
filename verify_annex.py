"""
Comprehensive IS 10262:2019 Verification Script
Verifies:
1. Annex A: Illustrative Example for OPC M40 Mix
2. Annex B: Illustrative Example for PPC/Fly Ash M40 Mix with Moisture Corrections
"""

def verify_annex_a():
    print("=" * 70)
    print("ANNEX A VERIFICATION - M40 OPC CONCRETE")
    print("=" * 70)

    # Inputs from Annex A of IS 10262:2019
    fck = 40
    msa = 20
    exposure = "Severe"
    slump = 100
    is_pumped = True
    zone = "Zone I"
    sg_opc = 3.15
    sg_ca = 2.74
    sg_fa = 2.74
    sg_admixture = 1.145
    admixture_dosage_pct = 1.0 # % by wt of cement
    water_reduction_pct = 20.0 # 20% water reduction with superplasticizer
    
    # 1. Target Mean Strength
    # Table 1: X = 6.5 for M30-M60
    # Table 2: S = 5.0 for M30-M60
    X = 6.5
    S = 5.0
    fck_prime_1 = fck + 1.65 * S # 48.25 MPa
    fck_prime_2 = fck + X        # 46.5 MPa
    target_strength = max(fck_prime_1, fck_prime_2)
    print(f"1. Target Mean Strength = max({fck} + 1.65*{S}, {fck} + {X}) = {target_strength} N/mm²")

    # 2. Water-Cement Ratio
    # Annex A selects w/c = 0.40 based on experience/strength curve
    # IS 456 Table 5 Max w/c for Severe RCC = 0.45
    wc_strength = 0.40
    wc_durability = 0.45
    adopted_wc = min(wc_strength, wc_durability)
    print(f"2. Adopted w/c Ratio = min(Strength w/c: {wc_strength}, Durability Max w/c: {wc_durability}) = {adopted_wc}")

    # 3. Air Content
    air_pct = 1.0 # Table 3 for 20mm MSA = 1.0% (0.01 m³)
    print(f"3. Air Content = {air_pct}% (Volume = {air_pct/100:.3f} m³)")

    # 4. Water Content
    w_base = 186 # Table 4 for 20mm MSA & 50mm slump
    # Slump adjustment: 100mm slump is +50mm above reference 50mm -> +6% water
    slump_adj_pct = ((slump - 50) / 25) * 3.0 # +6%
    w_slump_adj = w_base * (1 + slump_adj_pct/100) # 197.16 kg/m³
    # Water reduction 20%
    w_final = w_slump_adj * (1 - water_reduction_pct/100) # 157.73 kg/m³ (~158 kg in standard)
    print(f"4. Water Content: Base={w_base} kg, Slump Adj (+{slump_adj_pct}%)= {w_slump_adj:.2f} kg, Final (-{water_reduction_pct}% admix)= {w_final:.2f} kg/m³")

    # 5. Cement Content
    c_calc = w_final / adopted_wc # 157.73 / 0.40 = 394.32 kg/m³ (~395 kg in standard)
    c_min = 320 # IS 456 Table 5 Severe RCC
    c_adopted = max(c_calc, c_min)
    print(f"5. Cement Content: Calculated={c_calc:.2f} kg/m³, Min Durability={c_min} kg/m³, Adopted={c_adopted:.2f} kg/m³")

    # 6. Aggregate Proportions
    ca_base = 0.60 # Table 5 for 20mm MSA & Zone I @ w/c 0.50
    # Adjustment for w/c = 0.40: for every 0.05 reduction below 0.50, +0.01 CA prop -> (0.50-0.40)/0.05 * 0.01 = +0.02
    ca_wc_adj = ca_base + 0.02 # 0.62
    # Pumping adjustment: reduce by 10% for pumped concrete -> 0.62 * 0.90 = 0.558 (~0.56)
    ca_final_prop = ca_wc_adj * 0.90 if is_pumped else ca_wc_adj
    fa_final_prop = 1.0 - ca_final_prop
    print(f"6. Aggregate Proportions: CA base={ca_base}, w/c adj={ca_wc_adj:.2f}, Pumped CA prop={ca_final_prop:.3f}, FA prop={fa_final_prop:.3f}")

    # 7. Absolute Volume Calculation
    v_c = c_adopted / (sg_opc * 1000)
    v_w = w_final / (1.0 * 1000)
    m_admix = c_adopted * (admixture_dosage_pct / 100)
    v_admix = m_admix / (sg_admixture * 1000)
    v_air = air_pct / 100

    v_agg_total = 1.0 - (v_c + v_w + v_admix + v_air)
    v_ca = v_agg_total * ca_final_prop
    v_fa = v_agg_total * fa_final_prop

    m_ca_ssd = v_ca * sg_ca * 1000
    m_fa_ssd = v_fa * sg_fa * 1000

    # Annex A splits CA into 60% 20mm and 40% 10mm
    m_ca_20mm = m_ca_ssd * 0.60
    m_ca_10mm = m_ca_ssd * 0.40

    print(f"7. Volumes: Cement={v_c:.4f} m³, Water={v_w:.4f} m³, Admix={v_admix:.5f} m³, Air={v_air:.3f} m³, Total Agg={v_agg_total:.4f} m³")
    print(f"8. Final SSD Quantities (per m³):")
    print(f"   - Cement: {c_adopted:.2f} kg")
    print(f"   - Water: {w_final:.2f} kg")
    print(f"   - Fine Aggregate: {m_fa_ssd:.2f} kg")
    print(f"   - Coarse Aggregate 20mm (60%): {m_ca_20mm:.2f} kg")
    print(f"   - Coarse Aggregate 10mm (40%): {m_ca_10mm:.2f} kg")
    print(f"   - Total Coarse Aggregate: {m_ca_ssd:.2f} kg")
    print(f"   - Chemical Admixture: {m_admix:.2f} kg")
    print(f"   - Proportions: 1 : {m_fa_ssd/c_adopted:.2f} : {m_ca_ssd/c_adopted:.2f}")

def verify_annex_b():
    print("\n" + "=" * 70)
    print("ANNEX B VERIFICATION - M40 FLY ASH CONCRETE WITH MOISTURE CORRECTION")
    print("=" * 70)

    fck = 40
    msa = 20
    exposure = "Severe"
    slump = 75 # Slump in Annex B
    is_pumped = True
    zone = "Zone I"
    fly_ash_pct = 25.0 # 25% fly ash replacement
    sg_opc = 3.15
    sg_flyash = 2.20
    sg_ca = 2.74
    sg_fa = 2.74
    sg_admixture = 1.145
    admixture_dosage_pct = 1.0 # % by wt of cementitious
    water_reduction_pct = 23.0 # 23% water reduction
    
    # Aggregate moisture and absorption values from Annex B example
    fa_abs = 1.0 # % absorption
    fa_mois = 2.0 # % moisture (free water = +1%)
    ca1_abs = 0.5 # % absorption
    ca1_mois = 0.0 # % moisture (dry aggregate, absorbs -0.5%)
    ca2_abs = 0.5
    ca2_mois = 0.0

    # 1. Target Mean Strength
    X = 6.5
    S = 5.0
    fck_prime = fck + 1.65 * S # 48.25 N/mm²

    # 2. Water-Cementitious Ratio
    adopted_w_cm = 0.37 # Selected in Annex B

    # 3. Water Content
    w_base = 186
    # Slump adjustment: 75mm slump (+25mm) -> +3%
    slump_adj_pct = ((slump - 50)/25) * 3.0 # +3%
    w_slump_adj = w_base * (1 + slump_adj_pct/100) # 191.58 kg
    # Water reduction 23%
    w_final = w_slump_adj * (1 - water_reduction_pct/100) # 147.52 kg (~148 kg)

    # 4. Cementitious Material Content
    cm_calc = w_final / adopted_w_cm # 147.52 / 0.37 = 398.7 kg (~399 kg)
    cm_min = 320 # IS 456 Table 5 Severe
    cm_adopted = max(cm_calc, cm_min)

    m_flyash = cm_adopted * (fly_ash_pct / 100) # 25% = 99.68 kg (~100 kg)
    m_opc = cm_adopted * (1 - fly_ash_pct / 100)   # 75% = 299.02 kg (~299 kg)

    # 5. Coarse Aggregate & Fine Aggregate Proportions
    ca_base = 0.60
    # w/c adjustment: (0.50 - 0.37)/0.05 * 0.01 = +0.026
    ca_wc_adj = ca_base + ((0.50 - adopted_w_cm)/0.05) * 0.01 # 0.626
    ca_final_prop = ca_wc_adj * 0.90 if is_pumped else ca_wc_adj # 0.5634
    fa_final_prop = 1.0 - ca_final_prop # 0.4366

    # 6. Volumes
    v_opc = m_opc / (sg_opc * 1000)
    v_fa_scm = m_flyash / (sg_flyash * 1000)
    v_w = w_final / (1.0 * 1000)
    m_admix = cm_adopted * (admixture_dosage_pct / 100)
    v_admix = m_admix / (sg_admixture * 1000)
    v_air = 1.0 / 100 # 1%

    v_agg_total = 1.0 - (v_opc + v_fa_scm + v_w + v_admix + v_air)
    v_ca = v_agg_total * ca_final_prop
    v_fa = v_agg_total * fa_final_prop

    m_ca_ssd = v_ca * sg_ca * 1000
    m_fa_ssd = v_fa * sg_fa * 1000

    m_ca_20mm_ssd = m_ca_ssd * 0.60
    m_ca_10mm_ssd = m_ca_ssd * 0.40

    # 7. Field Batching Moisture Correction
    # Free moisture in FA = 2% - 1% = +1.0% free water
    # Free moisture in CA 20mm = 0% - 0.5% = -0.5% (absorbs water)
    # Free moisture in CA 10mm = 0% - 0.5% = -0.5% (absorbs water)
    
    m_fa_field = m_fa_ssd * (1 + (fa_mois - fa_abs)/100)
    m_ca_20mm_field = m_ca_20mm_ssd * (1 + (ca1_mois - ca1_abs)/100)
    m_ca_10mm_field = m_ca_10mm_ssd * (1 + (ca2_mois - ca2_abs)/100)
    m_ca_field_total = m_ca_20mm_field + m_ca_10mm_field

    w_contrib_fa = m_fa_ssd * ((fa_mois - fa_abs)/100)
    w_contrib_ca20 = m_ca_20mm_ssd * ((ca1_mois - ca1_abs)/100)
    w_contrib_ca10 = m_ca_10mm_ssd * ((ca2_mois - ca2_abs)/100)
    w_contrib_net = w_contrib_fa + w_contrib_ca20 + w_contrib_ca10

    w_field = w_final - w_contrib_net

    print(f"1. Target Strength = {fck_prime} N/mm²")
    print(f"2. Adopted w/cm = {adopted_w_cm}")
    print(f"3. Water Final = {w_final:.2f} kg/m³")
    print(f"4. Cementitious Total = {cm_adopted:.2f} kg (OPC: {m_opc:.2f} kg, Fly Ash: {m_flyash:.2f} kg)")
    print(f"5. SSD Quantities:")
    print(f"   - OPC: {m_opc:.2f} kg")
    print(f"   - Fly Ash: {m_flyash:.2f} kg")
    print(f"   - Water: {w_final:.2f} kg")
    print(f"   - Fine Aggregate (SSD): {m_fa_ssd:.2f} kg")
    print(f"   - Coarse Aggregate 20mm (SSD): {m_ca_20mm_ssd:.2f} kg")
    print(f"   - Coarse Aggregate 10mm (SSD): {m_ca_10mm_ssd:.2f} kg")
    print(f"   - Chemical Admixture: {m_admix:.2f} kg")
    print(f"6. Field Batching Adjusted Quantities (Moisture Corrected):")
    print(f"   - Fine Aggregate (Field): {m_fa_field:.2f} kg")
    print(f"   - Coarse Aggregate 20mm (Field): {m_ca_20mm_field:.2f} kg")
    print(f"   - Coarse Aggregate 10mm (Field): {m_ca_10mm_field:.2f} kg")
    print(f"   - Net Water Contribution from Aggregates: {w_contrib_net:.2f} kg")
    print(f"   - Actual Mixing Water to be Added: {w_field:.2f} kg")
    print(f"   - Field Batch Mix Ratio: 1 : {m_fa_field/cm_adopted:.2f} : {m_ca_field_total/cm_adopted:.2f}")

if __name__ == "__main__":
    verify_annex_a()
    verify_annex_b()
