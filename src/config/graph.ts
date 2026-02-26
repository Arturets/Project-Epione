import { GraphDomain, GraphEdgeDirection, GraphEdgeStrength, GraphEdgeType, GraphNodeTier } from '../lib/types';

export type GraphNodeId = string;

export type GraphNodeConfig = {
  id: GraphNodeId;
  label: string;
  x: number;
  y: number;
  tier: GraphNodeTier;
  domain: GraphDomain;
  description: string;
};

export type GraphEdgeConfig = {
  id: string;
  source: GraphNodeId;
  target: GraphNodeId;
  direction: GraphEdgeDirection;
  effectStrength: GraphEdgeStrength;
  type: GraphEdgeType;
  description: string;
};

export const GRAPH_CANVAS = {
  width: 1320,
  height: 860
} as const;

export const GRAPH_NODES: GraphNodeConfig[] = [
  {
    id: 'weight',
    label: 'Weight',
    x: 220,
    y: 410,
    tier: 'core',
    domain: 'metabolic',
    description: 'Total body mass; interacts with cardiovascular strain, composition, and performance metrics.'
  },
  {
    id: 'body_fat',
    label: 'Body Fat %',
    x: 390,
    y: 230,
    tier: 'core',
    domain: 'metabolic',
    description: 'Body composition marker tied to metabolic flexibility, aerobic efficiency, and risk profile.'
  },
  {
    id: 'vo2_max',
    label: 'VO2 Max',
    x: 660,
    y: 170,
    tier: 'core',
    domain: 'respiratory',
    description: 'Integrated cardio-respiratory fitness capacity and a key endurance performance indicator.'
  },
  {
    id: 'rhr',
    label: 'Resting HR',
    x: 930,
    y: 230,
    tier: 'core',
    domain: 'cardiovascular',
    description: 'Baseline autonomic/cardiovascular load marker that shifts with fitness, stress, and hydration.'
  },
  {
    id: 'hrv',
    label: 'HRV',
    x: 1100,
    y: 410,
    tier: 'core',
    domain: 'nervous',
    description: 'Autonomic nervous system variability signal, often used as a recovery/readiness proxy.'
  },
  {
    id: 'sleep',
    label: 'Sleep',
    x: 930,
    y: 590,
    tier: 'core',
    domain: 'recovery',
    description: 'Sleep duration metric linked to cognitive, hormonal, and autonomic recovery outcomes.'
  },
  {
    id: 'stress',
    label: 'Stress',
    x: 660,
    y: 650,
    tier: 'core',
    domain: 'nervous',
    description: 'Self-reported stress load that strongly influences sleep, recovery, and training response.'
  },
  {
    id: 'blood_pressure',
    label: 'Blood Pressure',
    x: 1130,
    y: 250,
    tier: 'supporting',
    domain: 'cardiovascular',
    description: 'Hemodynamic pressure marker influenced by vascular tone, fluid balance, and sympathetic load.'
  },
  {
    id: 'resting_resp_rate',
    label: 'Resting Resp Rate',
    x: 980,
    y: 90,
    tier: 'supporting',
    domain: 'respiratory',
    description: 'Resting respiratory frequency; can increase with stress, illness, poor recovery, or low fitness.'
  },
  {
    id: 'spo2',
    label: 'SpO2',
    x: 770,
    y: 70,
    tier: 'supporting',
    domain: 'respiratory',
    description: 'Peripheral oxygen saturation, reflecting blood oxygen loading and respiratory efficiency.'
  },
  {
    id: 'lactate_threshold',
    label: 'Lactate Threshold',
    x: 540,
    y: 90,
    tier: 'supporting',
    domain: 'respiratory',
    description: 'Exercise intensity where lactate accumulation accelerates; key endurance adaptation marker.'
  },
  {
    id: 'training_load',
    label: 'Training Load',
    x: 1170,
    y: 560,
    tier: 'supporting',
    domain: 'musculoskeletal',
    description: 'Recent internal/external workload aggregate (e.g., sRPE, volume, intensity, monotony).'    
  },
  {
    id: 'recovery_readiness',
    label: 'Recovery Readiness',
    x: 1010,
    y: 760,
    tier: 'supporting',
    domain: 'recovery',
    description: 'Composite readiness estimate from sleep, HRV, fatigue, soreness, and perceived exertion.'
  },
  {
    id: 'hydration',
    label: 'Hydration',
    x: 1230,
    y: 410,
    tier: 'supporting',
    domain: 'metabolic',
    description: 'Hydration/electrolyte status proxy that can influence HR, blood pressure, and training capacity.'
  },
  {
    id: 'glucose_control',
    label: 'Glucose Control',
    x: 360,
    y: 90,
    tier: 'supporting',
    domain: 'metabolic',
    description: 'Insulin sensitivity and glycemic stability proxy linked with adiposity and energy regulation.'
  },
  {
    id: 'inflammation',
    label: 'Inflammation',
    x: 760,
    y: 810,
    tier: 'supporting',
    domain: 'recovery',
    description: 'Systemic inflammatory load proxy (e.g., soreness, CRP trends, immune stress response).'    
  },
  {
    id: 'muscle_mass',
    label: 'Muscle Mass',
    x: 220,
    y: 590,
    tier: 'supporting',
    domain: 'musculoskeletal',
    description: 'Lean mass reserve that impacts strength, resting metabolism, and long-term resilience.'
  },
  {
    id: 'strength_index',
    label: 'Strength Index',
    x: 260,
    y: 760,
    tier: 'supporting',
    domain: 'musculoskeletal',
    description: 'Relative force output trend (e.g., normalized 1RM/isometric metrics).'
  },
  {
    id: 'energy_availability',
    label: 'Energy Availability',
    x: 500,
    y: 780,
    tier: 'supporting',
    domain: 'metabolic',
    description: 'Dietary energy remaining after training demand; low values can suppress recovery/hormones.'
  },
  {
    id: 'hormonal_balance',
    label: 'Hormonal Balance',
    x: 600,
    y: 810,
    tier: 'supporting',
    domain: 'metabolic',
    description: 'Stress/anabolic hormone environment shaping adaptation, mood, and body composition shifts.'
  },
  {
    id: 'sleep_quality',
    label: 'Sleep Quality',
    x: 940,
    y: 760,
    tier: 'supporting',
    domain: 'recovery',
    description: 'Sleep architecture/restorative quality proxy beyond duration alone.'
  },
  {
    id: 'mood',
    label: 'Mood',
    x: 680,
    y: 830,
    tier: 'supporting',
    domain: 'nervous',
    description: 'Affective state impacting stress perception, adherence, and recovery behavior.'
  }
];

export const GRAPH_EDGES: GraphEdgeConfig[] = [
  {
    id: 'sleep_to_hrv',
    source: 'sleep',
    target: 'hrv',
    direction: 'direct',
    effectStrength: 'high',
    type: 'causal',
    description: 'More sleep generally improves HRV through improved recovery and autonomic balance.'
  },
  {
    id: 'stress_to_sleep',
    source: 'stress',
    target: 'sleep',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'causal',
    description: 'Higher stress often shortens sleep duration and worsens sleep quality.'
  },
  {
    id: 'stress_to_hrv',
    source: 'stress',
    target: 'hrv',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Increased stress load is commonly associated with reduced HRV.'
  },
  {
    id: 'sleep_to_stress',
    source: 'sleep',
    target: 'stress',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'causal',
    description: 'Adequate sleep lowers perceived stress reactivity.'
  },
  {
    id: 'vo2_to_rhr',
    source: 'vo2_max',
    target: 'rhr',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Improved aerobic fitness is associated with lower resting heart rate.'
  },
  {
    id: 'vo2_to_hrv',
    source: 'vo2_max',
    target: 'hrv',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Cardiorespiratory fitness can improve HRV over time.'
  },
  {
    id: 'weight_to_vo2',
    source: 'weight',
    target: 'vo2_max',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Higher body weight can reduce relative VO2 max if capacity does not rise proportionally.'
  },
  {
    id: 'bodyfat_to_vo2',
    source: 'body_fat',
    target: 'vo2_max',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Lower body fat generally improves movement efficiency and relative aerobic metrics.'
  },
  {
    id: 'bodyfat_to_weight',
    source: 'body_fat',
    target: 'weight',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Body fat contributes directly to total body weight.'
  },
  {
    id: 'rhr_to_stress',
    source: 'rhr',
    target: 'stress',
    direction: 'direct',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Elevated resting heart rate can signal sympathetic load and stress.'
  },
  {
    id: 'blood_pressure_to_rhr',
    source: 'blood_pressure',
    target: 'rhr',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Higher vascular pressure load often coexists with elevated resting pulse.'
  },
  {
    id: 'hydration_to_blood_pressure',
    source: 'hydration',
    target: 'blood_pressure',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'causal',
    description: 'Improved fluid/electrolyte balance can reduce transient blood pressure strain.'
  },
  {
    id: 'hydration_to_rhr',
    source: 'hydration',
    target: 'rhr',
    direction: 'inverse',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Dehydration can elevate resting heart rate through reduced plasma volume.'
  },
  {
    id: 'vo2_to_resting_resp_rate',
    source: 'vo2_max',
    target: 'resting_resp_rate',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Higher aerobic efficiency is typically associated with lower resting respiratory rate.'
  },
  {
    id: 'resting_resp_rate_to_stress',
    source: 'resting_resp_rate',
    target: 'stress',
    direction: 'direct',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Higher resting respiratory rate often tracks with stress or fatigue load.'
  },
  {
    id: 'spo2_to_vo2',
    source: 'spo2',
    target: 'vo2_max',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Better oxygen saturation supports aerobic capacity and exercise tolerance.'
  },
  {
    id: 'lactate_threshold_to_vo2',
    source: 'lactate_threshold',
    target: 'vo2_max',
    direction: 'direct',
    effectStrength: 'high',
    type: 'causal',
    description: 'Threshold improvements often accompany VO2 max and endurance performance gains.'
  },
  {
    id: 'training_load_to_inflammation',
    source: 'training_load',
    target: 'inflammation',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'causal',
    description: 'Accumulated workload can increase inflammatory signals and tissue stress.'
  },
  {
    id: 'training_load_to_recovery',
    source: 'training_load',
    target: 'recovery_readiness',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'causal',
    description: 'High acute load without recovery tends to reduce readiness.'
  },
  {
    id: 'training_load_to_rhr',
    source: 'training_load',
    target: 'rhr',
    direction: 'direct',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Overreaching periods can temporarily elevate resting heart rate.'
  },
  {
    id: 'recovery_to_hrv',
    source: 'recovery_readiness',
    target: 'hrv',
    direction: 'direct',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Higher readiness states generally align with improved HRV patterns.'
  },
  {
    id: 'recovery_to_sleep',
    source: 'recovery_readiness',
    target: 'sleep',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Readiness and sleep quality usually improve together when load is well-managed.'
  },
  {
    id: 'sleep_quality_to_sleep',
    source: 'sleep_quality',
    target: 'sleep',
    direction: 'direct',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Better sleep architecture tends to accompany stable total sleep duration.'
  },
  {
    id: 'sleep_quality_to_hrv',
    source: 'sleep_quality',
    target: 'hrv',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'High-quality sleep typically yields stronger parasympathetic recovery signatures.'
  },
  {
    id: 'stress_to_sleep_quality',
    source: 'stress',
    target: 'sleep_quality',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'causal',
    description: 'Higher stress frequently fragments sleep and lowers restorative depth.'
  },
  {
    id: 'inflammation_to_hrv',
    source: 'inflammation',
    target: 'hrv',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Inflammatory load is often associated with suppressed HRV.'
  },
  {
    id: 'inflammation_to_sleep_quality',
    source: 'inflammation',
    target: 'sleep_quality',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Elevated inflammatory burden can impair sleep continuity and quality.'
  },
  {
    id: 'glucose_to_bodyfat',
    source: 'glucose_control',
    target: 'body_fat',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Improved glucose control is generally associated with lower body fat trends.'
  },
  {
    id: 'bodyfat_to_glucose',
    source: 'body_fat',
    target: 'glucose_control',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Higher body fat can worsen insulin sensitivity and glycemic regulation.'
  },
  {
    id: 'energy_to_hormonal',
    source: 'energy_availability',
    target: 'hormonal_balance',
    direction: 'direct',
    effectStrength: 'high',
    type: 'causal',
    description: 'Sufficient energy availability supports stable endocrine function and adaptation.'
  },
  {
    id: 'energy_to_recovery',
    source: 'energy_availability',
    target: 'recovery_readiness',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Fueling adequacy usually improves readiness and tolerance to training demand.'
  },
  {
    id: 'hormonal_to_stress',
    source: 'hormonal_balance',
    target: 'stress',
    direction: 'inverse',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Balanced endocrine state can reduce stress vulnerability and allostatic load.'
  },
  {
    id: 'hormonal_to_mood',
    source: 'hormonal_balance',
    target: 'mood',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Hormonal stability often improves mood regulation and motivation.'
  },
  {
    id: 'mood_to_stress',
    source: 'mood',
    target: 'stress',
    direction: 'inverse',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Improved mood and resilience usually track with lower perceived stress.'
  },
  {
    id: 'sleep_to_mood',
    source: 'sleep',
    target: 'mood',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: 'Consistent sleep tends to improve mood stability and emotional regulation.'
  },
  {
    id: 'muscle_to_strength',
    source: 'muscle_mass',
    target: 'strength_index',
    direction: 'direct',
    effectStrength: 'high',
    type: 'correlative',
    description: 'Greater lean mass generally supports higher strength expression potential.'
  },
  {
    id: 'hormonal_to_muscle',
    source: 'hormonal_balance',
    target: 'muscle_mass',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'causal',
    description: 'Anabolic-friendly hormonal state supports lean mass maintenance and growth.'
  },
  {
    id: 'strength_to_vo2',
    source: 'strength_index',
    target: 'vo2_max',
    direction: 'direct',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Strength improvements can indirectly support aerobic training quality and economy.'
  },
  {
    id: 'weight_to_blood_pressure',
    source: 'weight',
    target: 'blood_pressure',
    direction: 'direct',
    effectStrength: 'low',
    type: 'correlative',
    description: 'Higher body mass trends can elevate blood pressure load in susceptible individuals.'
  }
];
