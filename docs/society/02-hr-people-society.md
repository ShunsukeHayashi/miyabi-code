# 👥 HR & People Society - 人事・労務ソサエティ詳細設計

## Society Overview

### Mission Statement
「従業員ライフサイクル全体を通じて、最高の従業員体験を提供し、組織の成長を加速させる」

### Core Values
- **People First**: 従業員を最優先に
- **Fair & Transparent**: 公平で透明な人事運営
- **Growth Mindset**: 継続的な成長支援
- **Compliance**: 労働法令の完全遵守

---

## 🤖 Agent Detailed Specifications

### 1. CHRO-Agent (Chief Human Resources Officer Agent)

```rust
pub struct CHROAgent {
    role: "Society Leader",
    authority_level: "Executive",
    
    capabilities: [
        "hr_strategy_planning",
        "organization_design",
        "talent_management",
        "culture_development",
        "escalation_management",
    ],
    
    escalation_to: "Human CHRO / CEO",
    
    kpis: {
        employee_satisfaction: Target(4.2 / 5.0),
        turnover_rate: Target(< 10%),
        time_to_hire: Target(< 30 days),
        training_completion: Target(> 90%),
    }
}
```

**主な責務:**
- 人事戦略の策定と実行監督
- 組織設計・人員計画の立案
- 重要な人事判断（昇進・降格・解雇）の最終承認
- 労務問題・ハラスメント案件の対応判断
- 他Society Leaderとの人員調整

**意思決定フロー:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    HR Decision Flow                             │
├─────────────────────────────────────────────────────────────────┤
│  定型業務（勤怠・給与計算） → 担当Agent自動処理                │
│  中間管理職採用・評価 → CHRO-Agent承認                         │
│  幹部採用・重大懲戒・組織改編 → Human CHRO エスカレーション   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Recruiter-Agent (採用担当Agent)

```rust
pub struct RecruiterAgent {
    role: "Talent Acquisition Specialist",
    authority_level: "Operational",
    
    capabilities: [
        "job_description_creation",
        "sourcing_and_screening",
        "interview_scheduling",
        "candidate_assessment",
        "offer_negotiation_support",
    ],
    
    integrations: [
        "LinkedIn Recruiter",
        "Indeed",
        "Wantedly",
        "Green",
        "ビズリーチ",
        "HRMOS",
    ],
    
    ai_features: {
        resume_parsing: true,
        skill_matching: true,
        culture_fit_assessment: true,
        salary_benchmarking: true,
    }
}
```

**採用パイプライン自動化:**
```python
class RecruitmentPipeline:
    def process_application(self, application):
        """
        応募から内定までの自動パイプライン
        """
        # Step 1: 書類選考
        resume_score = self.analyze_resume(application.resume)
        skill_match = self.calculate_skill_match(
            application.skills,
            self.job_requirements
        )
        
        if resume_score < 60 or skill_match < 70:
            return self.reject_with_feedback(application)
        
        # Step 2: AIスクリーニング面接
        screening_result = self.ai_screening_interview(application)
        
        if not screening_result.passed:
            return self.reject_with_feedback(application)
        
        # Step 3: 技術試験（該当ポジションのみ）
        if self.requires_technical_test:
            test_result = self.conduct_technical_test(application)
            if test_result.score < self.pass_threshold:
                return self.reject_with_feedback(application)
        
        # Step 4: 面接スケジューリング
        available_slots = self.find_interview_slots(
            interviewers=self.get_interviewers(),
            candidate_preferences=application.availability
        )
        
        return self.schedule_interviews(application, available_slots)
    
    def analyze_resume(self, resume):
        """
        AIによる履歴書分析
        """
        extracted_info = {
            "experience_years": extract_experience(resume),
            "skills": extract_skills(resume),
            "education": extract_education(resume),
            "achievements": extract_achievements(resume),
            "career_progression": analyze_career_path(resume),
        }
        
        score = calculate_candidate_score(
            extracted_info,
            job_requirements=self.job.requirements,
            culture_fit_model=self.company.culture_model
        )
        
        return score
```

**ダイバーシティ配慮:**
```python
def ensure_diverse_pipeline(candidates):
    """
    採用パイプラインの多様性確保
    """
    # バイアス除去：名前・性別・年齢をマスク
    anonymized = anonymize_candidates(candidates)
    
    # スキルと経験のみで評価
    scored = score_by_merit(anonymized)
    
    # パイプライン多様性チェック
    diversity_metrics = calculate_diversity(scored)
    
    if not meets_diversity_targets(diversity_metrics):
        # ソーシング戦略を調整
        adjust_sourcing_strategy(diversity_metrics)
    
    return scored
```

---

### 3. Onboarding-Agent (入社対応Agent)

```rust
pub struct OnboardingAgent {
    role: "Employee Onboarding Specialist",
    
    capabilities: [
        "document_collection",
        "equipment_provisioning",
        "account_creation",
        "orientation_scheduling",
        "buddy_assignment",
    ],
    
    integrations: [
        "SmartHR",
        "KING OF TIME",
        "Google Workspace",
        "Slack",
        "Notion",
        "IT Asset Management",
    ],
    
    onboarding_duration: "30 days",
}
```

**入社オンボーディングフロー:**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Onboarding Timeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  入社-14日: 内定者情報収集開始                                  │
│            ├─ 必要書類リスト送付                               │
│            ├─ 住所・振込口座・緊急連絡先収集                   │
│            └─ 写真・サイズ情報収集                             │
│                                                                 │
│  入社-7日:  IT準備開始                                          │
│            ├─ PC発注・セットアップ                             │
│            ├─ メールアカウント作成                             │
│            ├─ Slack/Notion招待準備                             │
│            └─ 入館証発行依頼                                   │
│                                                                 │
│  入社-3日:  最終確認                                            │
│            ├─ 入社日時・場所の最終案内                         │
│            ├─ 初日スケジュール送付                             │
│            └─ バディ・メンター割当通知                         │
│                                                                 │
│  入社日:    オリエンテーション                                  │
│            ├─ 08:30 受付・入館証受渡                           │
│            ├─ 09:00 会社紹介・組織説明                         │
│            ├─ 10:00 PC/アカウントセットアップ                  │
│            ├─ 11:00 セキュリティ研修                           │
│            ├─ 12:00 ランチ（バディと）                         │
│            ├─ 13:00 部門紹介・チームMTG                        │
│            ├─ 15:00 業務ツール研修                             │
│            └─ 17:00 Day 1 完了チェック                         │
│                                                                 │
│  入社+7日:  1週間チェックイン                                   │
│            ├─ 困りごとヒアリング                               │
│            └─ 追加サポート提供                                 │
│                                                                 │
│  入社+30日: オンボーディング完了                                │
│            ├─ オンボーディングサーベイ実施                     │
│            └─ 試用期間目標設定                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Payroll-Agent (給与計算Agent)

```rust
pub struct PayrollAgent {
    role: "Payroll Specialist",
    
    capabilities: [
        "attendance_aggregation",
        "salary_calculation",
        "tax_withholding",
        "social_insurance",
        "payslip_distribution",
    ],
    
    compliance: [
        "労働基準法",
        "所得税法",
        "社会保険関連法",
        "マイナンバー法",
    ],
    
    accuracy_target: 100%,  // 給与計算は100%精度が必須
}
```

**給与計算エンジン:**
```python
class PayrollEngine:
    def calculate_monthly_salary(self, employee, period):
        """
        月次給与計算
        """
        # 基本給
        base_salary = employee.base_salary
        
        # 勤怠集計
        attendance = self.aggregate_attendance(employee, period)
        
        # 各種手当計算
        allowances = self.calculate_allowances(employee, attendance)
        overtime_pay = self.calculate_overtime(employee, attendance)
        
        # 総支給額
        gross_salary = (
            base_salary +
            allowances.total +
            overtime_pay
        )
        
        # 控除計算
        deductions = self.calculate_deductions(employee, gross_salary)
        
        # 差引支給額
        net_salary = gross_salary - deductions.total
        
        return PayrollResult(
            employee=employee,
            period=period,
            gross_salary=gross_salary,
            deductions=deductions,
            net_salary=net_salary,
            breakdown=self.generate_breakdown(...)
        )
    
    def calculate_overtime(self, employee, attendance):
        """
        残業代計算（労働基準法準拠）
        """
        hourly_rate = employee.base_salary / employee.standard_hours
        
        overtime_pay = 0
        
        # 法定内残業（所定外・法定内）
        if attendance.overtime_within_legal > 0:
            overtime_pay += hourly_rate * 1.0 * attendance.overtime_within_legal
        
        # 法定外残業（60時間以下）
        if attendance.overtime_legal <= 60:
            overtime_pay += hourly_rate * 1.25 * attendance.overtime_legal
        else:
            # 60時間超は50%増し
            overtime_pay += hourly_rate * 1.25 * 60
            overtime_pay += hourly_rate * 1.50 * (attendance.overtime_legal - 60)
        
        # 深夜残業
        overtime_pay += hourly_rate * 0.25 * attendance.late_night_hours
        
        # 休日出勤
        overtime_pay += hourly_rate * 1.35 * attendance.holiday_hours
        
        return overtime_pay
```

---

### 5. Attendance-Agent (勤怠管理Agent)

```rust
pub struct AttendanceAgent {
    role: "Time & Attendance Specialist",
    
    capabilities: [
        "clock_in_out_monitoring",
        "overtime_tracking",
        "leave_management",
        "compliance_monitoring",
        "anomaly_detection",
    ],
    
    integrations: [
        "KING OF TIME",
        "ジョブカン",
        "freee人事労務",
        "SmartHR",
    ],
    
    alerts: [
        "36協定上限接近",
        "打刻漏れ",
        "異常な勤務パターン",
        "有給消化率低下",
    ],
}
```

**36協定監視:**
```python
class Compliance36Monitor:
    def monitor_overtime(self, employee):
        """
        36協定上限の監視
        """
        current_month_ot = get_overtime_hours(employee, "current_month")
        ytd_overtime = get_overtime_hours(employee, "year_to_date")
        
        # 月間上限チェック（45時間）
        if current_month_ot >= 40:
            self.send_alert(
                level="WARNING",
                message=f"{employee.name}さんの残業が40時間を超えました",
                action="上長へ通知"
            )
        
        if current_month_ot >= 45:
            self.send_alert(
                level="CRITICAL",
                message=f"{employee.name}さんの残業が月間上限45時間に達しました",
                action="業務調整が必要"
            )
        
        # 年間上限チェック（360時間）
        if ytd_overtime >= 300:
            self.send_alert(
                level="WARNING",
                message=f"{employee.name}さんの年間残業が300時間を超えました",
                action="年度内の残業抑制が必要"
            )
        
        # 特別条項適用チェック（年6回まで月80時間）
        months_over_45 = count_months_over_45(employee, "current_year")
        if months_over_45 >= 5:
            self.send_alert(
                level="CRITICAL",
                message=f"特別条項適用が年間5回目です",
                action="残り1回のみ適用可能"
            )
```

---

### 6. Benefits-Agent (福利厚生Agent)

```rust
pub struct BenefitsAgent {
    role: "Benefits Administration Specialist",
    
    capabilities: [
        "social_insurance_management",
        "health_checkup_coordination",
        "cafeteria_plan_management",
        "commuter_allowance",
        "welfare_program_management",
    ],
    
    insurance_types: [
        "健康保険",
        "厚生年金",
        "雇用保険",
        "労災保険",
    ],
}
```

**社会保険手続き自動化:**
```python
def process_insurance_enrollment(employee, event_type):
    """
    社会保険手続きの自動処理
    """
    if event_type == "入社":
        # 資格取得届
        forms = [
            generate_form("健康保険・厚生年金保険被保険者資格取得届"),
            generate_form("雇用保険被保険者資格取得届"),
        ]
        
        if employee.has_dependents:
            forms.append(
                generate_form("健康保険被扶養者(異動)届")
            )
        
    elif event_type == "退職":
        # 資格喪失届
        forms = [
            generate_form("健康保険・厚生年金保険被保険者資格喪失届"),
            generate_form("雇用保険被保険者資格喪失届"),
        ]
        
        # 離職票（本人希望時）
        if employee.wants_separation_certificate:
            forms.append(generate_separation_certificate(employee))
    
    # 電子申請（e-Gov）
    for form in forms:
        submit_to_egov(form)
    
    return ProcessingResult(forms)
```

---

### 7. Training-Agent (研修・育成Agent)

```rust
pub struct TrainingAgent {
    role: "Learning & Development Specialist",
    
    capabilities: [
        "training_needs_analysis",
        "learning_path_design",
        "elearning_management",
        "skill_assessment",
        "certification_tracking",
    ],
    
    integrations: [
        "Udemy Business",
        "LinkedIn Learning",
        "Schoo",
        "内製LMS",
    ],
}
```

**パーソナライズド学習パス:**
```python
def create_personalized_learning_path(employee):
    """
    個人別の学習パス生成
    """
    # 現在のスキルアセスメント
    current_skills = assess_skills(employee)
    
    # 目標役職・職種のスキル要件
    target_requirements = get_role_requirements(employee.career_goal)
    
    # ギャップ分析
    skill_gaps = identify_gaps(current_skills, target_requirements)
    
    # 学習コンテンツのレコメンド
    recommendations = []
    for gap in skill_gaps:
        courses = find_relevant_courses(
            skill=gap.skill,
            level=gap.required_level,
            employee_preferences=employee.learning_preferences
        )
        
        recommendations.append(LearningRecommendation(
            skill=gap.skill,
            current_level=gap.current_level,
            target_level=gap.required_level,
            courses=courses,
            estimated_duration=calculate_duration(courses),
        ))
    
    return LearningPath(
        employee=employee,
        recommendations=recommendations,
        milestones=generate_milestones(recommendations),
        timeline=create_timeline(recommendations),
    )
```

---

### 8. Evaluation-Agent (評価・査定Agent)

```rust
pub struct EvaluationAgent {
    role: "Performance Management Specialist",
    
    capabilities: [
        "goal_setting_facilitation",
        "performance_tracking",
        "360_degree_feedback",
        "calibration_support",
        "compensation_calculation",
    ],
    
    evaluation_cycles: ["半期", "四半期", "随時"],
}
```

**評価プロセス自動化:**
```python
class PerformanceEvaluationCycle:
    def run_evaluation_cycle(self, period):
        """
        評価サイクルの自動実行
        """
        timeline = {
            "goal_setting": period.start - timedelta(days=14),
            "mid_review": period.start + (period.duration / 2),
            "self_evaluation": period.end - timedelta(days=14),
            "manager_evaluation": period.end - timedelta(days=7),
            "calibration": period.end,
            "feedback_delivery": period.end + timedelta(days=7),
        }
        
        # 各フェーズのリマインド自動送信
        for phase, date in timeline.items():
            schedule_reminder(phase, date)
        
        return EvaluationCycleSchedule(timeline)
    
    def calculate_rating_distribution(self, department):
        """
        評価分布の正規化（強制分布方式）
        """
        target_distribution = {
            "S": 0.05,   # 5%
            "A": 0.20,   # 20%
            "B": 0.50,   # 50%
            "C": 0.20,   # 20%
            "D": 0.05,   # 5%
        }
        
        raw_ratings = get_raw_ratings(department)
        
        # カリブレーション提案
        calibration_suggestions = []
        for rating, target_pct in target_distribution.items():
            current_pct = calculate_percentage(raw_ratings, rating)
            
            if abs(current_pct - target_pct) > 0.05:
                calibration_suggestions.append(
                    CalibrationSuggestion(
                        rating=rating,
                        current_pct=current_pct,
                        target_pct=target_pct,
                        candidates=find_calibration_candidates(raw_ratings, rating)
                    )
                )
        
        return calibration_suggestions
```

---

### 9. Exit-Agent (退職対応Agent)

```rust
pub struct ExitAgent {
    role: "Offboarding Specialist",
    
    capabilities: [
        "resignation_processing",
        "exit_interview",
        "knowledge_transfer",
        "asset_return",
        "final_settlement",
    ],
    
    retention_analysis: true,
}
```

**退職オフボーディングフロー:**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Offboarding Timeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  退職申出日:                                                    │
│            ├─ 退職届受理・確認                                 │
│            ├─ 退職日・有給消化の調整                           │
│            └─ 後任者・引継ぎ計画策定                           │
│                                                                 │
│  退職-14日:                                                     │
│            ├─ Exit Interview スケジュール                      │
│            ├─ 引継ぎドキュメント作成開始                       │
│            └─ アクセス権限の棚卸                               │
│                                                                 │
│  退職-7日:                                                      │
│            ├─ Exit Interview 実施                              │
│            ├─ 引継ぎMTG実施                                    │
│            └─ 備品返却準備                                     │
│                                                                 │
│  退職日:                                                        │
│            ├─ 最終引継ぎ確認                                   │
│            ├─ 備品返却・入館証回収                             │
│            ├─ アカウント無効化                                 │
│            └─ 退職手続き書類渡し                               │
│                                                                 │
│  退職後:                                                        │
│            ├─ 最終給与計算・振込                               │
│            ├─ 離職票発行（希望者）                             │
│            ├─ 源泉徴収票発行                                   │
│            └─ アルムナイネットワーク招待                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**退職理由分析:**
```python
def analyze_turnover(exits, period):
    """
    退職理由の分析とインサイト抽出
    """
    analysis = TurnoverAnalysis(period)
    
    # Exit Interviewデータの集計
    reasons = categorize_exit_reasons(exits)
    
    analysis.top_reasons = sorted(
        reasons.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    # 部門別・等級別分析
    analysis.by_department = analyze_by_dimension(exits, "department")
    analysis.by_level = analyze_by_dimension(exits, "job_level")
    analysis.by_tenure = analyze_by_dimension(exits, "tenure")
    
    # 改善提案生成
    analysis.recommendations = generate_retention_recommendations(
        top_reasons=analysis.top_reasons,
        industry_benchmarks=get_benchmarks()
    )
    
    return analysis
```

---

## 🔄 Society Internal Workflow

### 採用〜入社〜退職のEnd-to-End フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                 Employee Lifecycle Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │Recruiter │───▶│Onboarding│───▶│ Training │                  │
│  │ Agent    │    │  Agent   │    │  Agent   │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│       │                               │                         │
│       │                               ▼                         │
│       │          ┌──────────┐    ┌──────────┐                  │
│       │          │Attendance│◀───│ Payroll  │                  │
│       │          │  Agent   │───▶│  Agent   │                  │
│       │          └──────────┘    └──────────┘                  │
│       │               │                                         │
│       │               ▼                                         │
│       │          ┌──────────┐    ┌──────────┐                  │
│       │          │Benefits  │    │Evaluation│                  │
│       │          │ Agent    │    │  Agent   │                  │
│       │          └──────────┘    └──────────┘                  │
│       │                               │                         │
│       │                               ▼                         │
│       │                          ┌──────────┐                  │
│       │                          │  Exit    │                  │
│       └──────────────────────────│  Agent   │                  │
│         (再入社パス)              └──────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 KPIs & Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 採用リードタイム | < 30日 | 応募〜内定までの日数 |
| 採用コスト | < 50万円/人 | 総採用コスト / 採用人数 |
| オンボーディング完了率 | 100% | 30日以内完了率 |
| 給与計算精度 | 100% | エラー発生率 |
| 有給取得率 | > 70% | 取得日数 / 付与日数 |
| 研修完了率 | > 90% | 必須研修完了者率 |
| 従業員満足度 | > 4.0/5.0 | eNPS調査結果 |
| 離職率 | < 10% | 年間離職率 |

---

*HR & People Society v1.0.0*
*Last Updated: 2025-11-30*
