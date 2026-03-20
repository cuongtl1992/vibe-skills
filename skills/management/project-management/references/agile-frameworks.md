# Agile / Scrum / XP — Tham chiếu framework & Hỗ trợ tác vụ

---

## PHẦN A — SCRUM

### A1. Scrum Ceremonies

#### Sprint Planning
**Mục tiêu**: Xác định Sprint Goal và cam kết backlog items cho sprint.

**Checklist chuẩn bị**:
- [ ] Product Backlog đã được groomed & prioritized
- [ ] Velocity trung bình 3 sprint gần nhất đã tính
- [ ] Capacity từng thành viên đã xác nhận
- [ ] Definition of Ready cho top items đã đạt

**Agenda (time-boxed cho 2-week sprint)**:
| Phần | Thời gian | Nội dung |
|------|-----------|---------|
| Part 1: What | 2 giờ | PO trình bày Sprint Goal + top backlog items |
| Part 2: How | 2 giờ | Dev team phân tích, estimate, tách task |
| Wrap-up | 30 phút | Xác nhận commitment, ghi Sprint Backlog |

**Output template Sprint Goal**:
```
Sprint Goal: [Động từ] + [Đối tượng] + [Giá trị mang lại]
Ví dụ: "Cho phép người dùng đăng nhập bằng Google OAuth
        để rút ngắn thời gian onboarding xuống < 1 phút"
```

---

#### Daily Scrum (Standup)
**Time-box**: 15 phút | **Diễn ra**: Cùng giờ mỗi ngày

**3 câu hỏi chuẩn**:
1. Hôm qua tôi đã làm gì để tiến tới Sprint Goal?
2. Hôm nay tôi sẽ làm gì?
3. Có trở ngại nào cần tháo gỡ không?

**Anti-pattern cần tránh**:
- ❌ Báo cáo cho Scrum Master thay vì nói với team
- ❌ Giải quyết vấn đề ngay trong standup (→ park & discuss sau)
- ❌ Kéo dài quá 15 phút

**Output khi Claude hỗ trợ standup**:
Tổng hợp từ Daily Health Check (tác vụ 11) → format sẵn 3 câu hỏi cho từng thành viên.

---

#### Sprint Review
**Time-box**: 4 giờ cho 1-month sprint (scale tỷ lệ theo độ dài sprint)
**Thành phần tham dự**: Scrum Team + Stakeholders

**Agenda**:
| Phần | Nội dung |
|------|---------|
| 1. Recap Sprint Goal | PO xác nhận Sprint Goal đạt/không đạt |
| 2. Demo | Dev team demo từng increment đã Done |
| 3. Feedback | Stakeholders phản hồi, đặt câu hỏi |
| 4. Backlog update | PO cập nhật backlog dựa trên feedback |
| 5. Next sprint preview | PO chia sẻ định hướng sprint tới |

**Output → Confluence** (template Sprint Review):
```
# Sprint [N] Review — [Ngày]

## Sprint Goal
[Mục tiêu] → ✅ Đạt / ❌ Không đạt

## Increment đã hoàn thành
| Story | Demo | Stakeholder Feedback |
|-------|------|---------------------|
| ...   | ✅   | ...                 |

## Không hoàn thành (và lý do)
| Story | Lý do | Hành động |
|-------|-------|-----------|

## Feedback từ Stakeholders
- [Tổng hợp các ý kiến quan trọng]

## Backlog thay đổi sau Review
- Thêm: ...
- Xóa/điều chỉnh: ...

## Preview Sprint tới
[Top items dự kiến]
```

---

#### Sprint Retrospective
**Time-box**: 3 giờ cho 1-month sprint
**Thành phần**: Scrum Team (không có stakeholders bên ngoài)

**Formats phổ biến — Claude sẽ hỏi team muốn dùng format nào**:

**Format 1: Start / Stop / Continue**
```
START: Những gì chúng ta nên bắt đầu làm?
STOP:  Những gì chúng ta nên dừng lại?
CONTINUE: Những gì đang tốt, cần giữ nguyên?
```

**Format 2: 4Ls**
```
Liked:    Những gì tôi thích trong sprint này?
Learned:  Tôi học được gì?
Lacked:   Chúng ta còn thiếu gì?
Longed for: Chúng ta mong muốn điều gì?
```

**Format 3: Mad / Sad / Glad**
```
Mad:  Điều gì khiến bạn bực bội?
Sad:  Điều gì khiến bạn thất vọng?
Glad: Điều gì khiến bạn hài lòng?
```

**Format 4: Sailboat**
```
⛵ Wind (Thuận lợi): Điều gì đang đẩy chúng ta tiến lên?
⚓ Anchor (Cản trở): Điều gì đang kéo chúng ta xuống?
🪸 Rocks (Rủi ro): Những nguy hiểm phía trước?
☀️ Island (Mục tiêu): Đích đến chúng ta muốn tới?
```

**Output → Confluence** (template Retro):
```
# Sprint [N] Retrospective — [Ngày]
Format: [Format đã dùng]

## Kết quả thảo luận
[Nội dung theo format đã chọn]

## 🎯 Action Items (tối đa 3 items)
| # | Action | Owner | Due |
|---|--------|-------|-----|
| 1 | ... | ... | Sprint N+1 |

## Follow-up từ Retro trước
| Action cũ | Trạng thái |
|-----------|-----------|
| ... | ✅ Done / ❌ Bỏ qua / 🔄 Đang làm |
```

---

#### Backlog Refinement (Grooming)
**Tần suất**: 1–2 lần/sprint | **Time-box**: 10% capacity sprint

**Checklist Definition of Ready (DoR)**:
- [ ] User Story viết đúng format As a / I want / So that
- [ ] Acceptance Criteria rõ ràng, testable
- [ ] Story đã được estimate (Planning Poker)
- [ ] Dependencies đã xác định
- [ ] Story đủ nhỏ để hoàn thành trong 1 sprint

**Output → Jira**: Cập nhật description, AC, story points trực tiếp lên từng issue.

---

### A2. Scrum Artifacts

#### Product Backlog
**Cấu trúc chuẩn**:
```
Epic → Feature → User Story → Task
```

**Prioritization techniques** (Claude sẽ gợi ý phù hợp):
| Kỹ thuật | Khi nào dùng |
|----------|-------------|
| MoSCoW | Khi cần phân loại Must/Should/Could/Won't |
| WSJF | Khi cần tính toán Cost of Delay / Job Size |
| RICE | Khi có dữ liệu Reach, Impact, Confidence, Effort |
| Kano | Khi muốn phân tích satisfaction của user |

**Output → Jira**: Sắp xếp lại priority, thêm label, cập nhật Epic link.

---

#### Definition of Done (DoD)
Template chuẩn để tạo/cập nhật DoD trên Confluence:
```
# Definition of Done — [Team/Project]

## Code
- [ ] Code đã được review bởi ít nhất 1 người
- [ ] Unit tests viết đủ, pass 100%
- [ ] Không có lỗi lint/sonar critical
- [ ] Code đã merge vào main/develop branch

## Testing
- [ ] Acceptance Criteria đã pass
- [ ] Regression test pass
- [ ] Performance test (nếu áp dụng)

## Documentation
- [ ] API docs cập nhật (nếu có thay đổi API)
- [ ] Confluence page cập nhật (nếu cần)
- [ ] Release notes bổ sung

## Deployment
- [ ] Deploy thành công lên staging
- [ ] PO đã verify và accept
```

---

### A3. Scrum Metrics & Tracking

#### Velocity
```
Velocity = Tổng story points Done trong sprint

Velocity trung bình = Trung bình 3 sprint gần nhất
(Loại bỏ sprint bị ảnh hưởng bởi nghỉ lễ / onboarding)
```

Claude sẽ tính và hiển thị:
```
Sprint 8:  34 pts
Sprint 9:  28 pts
Sprint 10: 32 pts
→ Avg Velocity: 31.3 pts
→ Recommended commitment: 28–31 pts (90–100% velocity)
```

#### Burndown Chart Analysis
Claude phân tích burndown bằng cách đọc data từ Jira và nhận xét:
- **Ideal line**: Story points giảm đều theo ngày
- **Cảnh báo**: Đường thực tế phẳng ≥ 2 ngày → có blockers
- **Scope creep**: Đường bắt đầu từ điểm cao hơn expected
- **Last-minute rush**: Đường thực tế dốc ở cuối sprint → risk

#### Sprint Report Template
```
# Sprint [N] Report

| Chỉ số | Giá trị | Sprint trước | Trend |
|--------|---------|-------------|-------|
| Velocity | X pts | Y pts | ↑↓→ |
| Story Done/Committed | X/Y | ... | ... |
| Bug count cuối sprint | X | ... | ... |
| Team satisfaction | X/5 | ... | ... |

## Highlights
## Challenges
## Improvements từ Retro
```

---

## PHẦN B — XP (EXTREME PROGRAMMING)

### B1. Các Practices XP cốt lõi

#### Test-Driven Development (TDD)
**Chu trình Red → Green → Refactor**:
```
1. RED:    Viết test fail trước (mô tả behavior mong muốn)
2. GREEN:  Viết code tối thiểu để test pass
3. REFACTOR: Cải thiện code mà không làm test fail
```

**Claude hỗ trợ**:
- Viết test cases từ Acceptance Criteria
- Review test coverage
- Gợi ý edge cases còn thiếu
- Tạo User Story → AC → test scaffold

**Output**: Danh sách test cases dạng Gherkin (Given/When/Then) từ AC của User Story.

---

#### Pair Programming
**Các vai trò**:
- **Driver**: Người viết code
- **Navigator**: Người review, gợi ý, nghĩ chiến lược

**Khi nào nên dùng**:
- Onboard member mới
- Giải quyết vấn đề phức tạp
- Code review thời gian thực
- Knowledge transfer

**Claude hỗ trợ**:
- Đóng vai Navigator khi dev chia sẻ code
- Gợi ý refactoring, edge cases, security issues
- Review code theo tiêu chí XP: Simple Design, YAGNI, DRY

---

#### Continuous Integration (CI)
**Checklist CI chuẩn XP**:
- [ ] Commit ít nhất 1 lần/ngày lên main branch
- [ ] Build tự động chạy sau mỗi commit
- [ ] Test suite chạy < 10 phút
- [ ] Build fail → fix ngay, không để qua đêm
- [ ] Không ai được push code khi build đang fail

---

#### Simple Design (4 Rules of Simple Design — Kent Beck)
Thứ tự ưu tiên:
1. **Passes all tests** — Code hoạt động đúng
2. **Reveals intention** — Code dễ đọc, tự giải thích
3. **No duplication** — Không lặp logic (DRY)
4. **Fewest elements** — Không thừa class/method/code

Claude sẽ review code theo 4 rules này khi được yêu cầu.

---

#### Refactoring
**Khi nào refactor**:
- Code smell: Long Method, God Class, Duplicate Code, Feature Envy
- Sau khi test pass (bước 3 TDD)
- Trước khi thêm tính năng mới vào vùng code phức tạp

**Output**: Claude gợi ý refactoring cụ thể (Extract Method, Move Method, Replace Conditional with Polymorphism...) khi phân tích code.

---

#### Collective Code Ownership
**Nguyên tắc**: Mọi thành viên đều có thể sửa bất kỳ phần code nào.

**Claude hỗ trợ**:
- Viết documentation chuẩn để code dễ hiểu với toàn team
- Review code theo tiêu chí readable-by-anyone
- Gợi ý coding standards, naming conventions

---

#### Small Releases
**Nguyên tắc XP**: Release thường xuyên, mỗi lần nhỏ, giá trị cao.

**Output → Confluence**: Release Note template
```
# Release [Version] — [Ngày]

## ✨ Tính năng mới
- [Story KEY-X]: Mô tả ngắn gọn

## 🐛 Bug fixes
- [Bug KEY-Y]: Mô tả fix

## ⚠️ Breaking changes
- [Nếu có]

## 🔧 How to upgrade
[Hướng dẫn nếu cần]
```

---

#### Planning Game (XP Planning)
Tương tự Sprint Planning nhưng nhấn mạnh:
- **Business decides**: Scope, priority, release date (PO/Customer)
- **Tech decides**: Estimates, technical approach (Dev team)
- **Stories = promises to have a conversation**, không phải spec cứng

**Iteration Planning** (= Sprint Planning trong XP):
- Iteration = 1–2 tuần
- Chỉ commit stories team **thực sự tin** hoàn thành được
- "Yesterday's weather": Commit = velocity iteration trước

---

### B2. XP Roles

| Role | Trách nhiệm |
|------|------------|
| Customer (PO) | Viết stories, prioritize, accept/reject stories |
| Programmer | Estimate, code, test, design |
| Coach | Hướng dẫn XP practices, remove impediments |
| Tracker | Theo dõi velocity, iteration plan, scope creep |

---

### B3. XP Values
Claude sẽ nhắc nhở và áp dụng 5 giá trị XP khi tư vấn:

| Value | Ý nghĩa thực tế |
|-------|----------------|
| **Communication** | Mọi thông tin chia sẻ kịp thời, không giấu vấn đề |
| **Simplicity** | Làm đơn giản nhất có thể hôm nay, không over-engineer |
| **Feedback** | Test liên tục, demo sớm, lấy feedback thường xuyên |
| **Courage** | Dám refactor, dám nói sự thật, dám thay đổi |
| **Respect** | Tôn trọng lẫn nhau, tôn trọng customer |

---

## PHẦN C — AGILE TỔNG QUÁT

### C1. Agile Manifesto — 4 Giá trị
```
1. Individuals and interactions   > Processes and tools
2. Working software               > Comprehensive documentation
3. Customer collaboration         > Contract negotiation
4. Responding to change           > Following a plan
```

Claude luôn áp dụng tư duy này khi tư vấn: ưu tiên giao tiếp, làm thứ hoạt động được, cộng tác với customer, và linh hoạt trước thay đổi.

---

### C2. 12 Agile Principles (tóm tắt thực hành)

| # | Principle | Áp dụng thực tế |
|---|-----------|----------------|
| 1 | Deliver value early & continuously | Release nhỏ, thường xuyên |
| 2 | Welcome changing requirements | Backlog luôn có thể điều chỉnh |
| 3 | Deliver working software frequently | Iteration 1–4 tuần |
| 4 | Business & dev collaborate daily | Daily standup, co-location |
| 5 | Build around motivated individuals | Team tự tổ chức |
| 6 | Face-to-face conversation | Ưu tiên video/in-person |
| 7 | Working software = progress | Demo > báo cáo |
| 8 | Sustainable pace | Không overtime liên tục |
| 9 | Technical excellence | Refactor, TDD, clean code |
| 10 | Simplicity | Maximize work NOT done |
| 11 | Self-organizing teams | Team tự chọn cách làm |
| 12 | Regular reflection | Retrospective định kỳ |

---

### C3. Agile Estimation

#### Planning Poker
**Bộ số Fibonacci**: 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ∞

**Quy trình**:
1. PO đọc User Story
2. Team đặt câu hỏi làm rõ
3. Mỗi người chọn số (giấu)
4. Lật cùng lúc
5. Người chọn cao nhất & thấp nhất giải thích
6. Estimate lại đến khi đồng thuận

**Hướng dẫn chọn số**:
| Points | Mô tả | Ví dụ |
|--------|-------|-------|
| 1 | Cực kỳ đơn giản | Thay đổi text label |
| 2 | Đơn giản | Thêm 1 field vào form |
| 3 | Nhỏ | CRUD đơn giản |
| 5 | Trung bình | Feature có logic nghiệp vụ |
| 8 | Lớn | Feature phức tạp, nhiều bước |
| 13 | Rất lớn → nên tách nhỏ | Nên break down |
| 21+ | Epic → bắt buộc tách | Quá lớn cho 1 sprint |

**Claude hỗ trợ**: Khi user paste User Story, Claude estimate và giải thích lý do chọn điểm, gợi ý cách tách nếu story quá lớn.

---

#### T-Shirt Sizing
Dùng cho high-level estimation (roadmap, epic):
```
XS = < 1 ngày
S  = 1–3 ngày
M  = 3–5 ngày (1 tuần)
L  = 1–2 tuần
XL = 2–4 tuần (nên tách)
XXL = > 1 tháng (Epic, cần breakdown)
```

---

### C4. Agile Anti-patterns — Nhận diện & Xử lý

Claude sẽ chủ động cảnh báo khi phát hiện các anti-pattern:

| Anti-pattern | Dấu hiệu | Đề xuất xử lý |
|-------------|---------|--------------|
| **ScrumBut** | "Chúng tôi dùng Scrum nhưng không có retro..." | Áp dụng đầy đủ ceremony trước khi bỏ bớt |
| **Fake Agile** | Có standup nhưng PM vẫn giao task từng người | Chuyển sang self-organizing team |
| **Sprint Overcommit** | Liên tục không hoàn thành sprint | Giảm commitment xuống 80% velocity |
| **Zombie Scrum** | Team không quan tâm đến Sprint Goal | Retro về engagement & motivation |
| **Waterfall in disguise** | Sprint là giai đoạn trong waterfall lớn | Tái cấu trúc thành independent increments |
| **Story too large** | Story > 8 points vào sprint | Break down thành sub-stories |
| **Definition of Done ignored** | Mark Done khi chưa test | Enforce DoD review trước khi close |
| **No Retrospective** | Bỏ qua retro khi busy | Retro là không thể bỏ, có thể rút ngắn |

---

### C5. Agile Scaling Frameworks (tham khảo)

| Framework | Khi nào phù hợp |
|-----------|----------------|
| **SAFe** | Tổ chức lớn, nhiều team, cần alignment cấp Portfolio |
| **LeSS** | 2–8 teams cùng product, muốn giữ Scrum thuần |
| **Nexus** | 3–9 Scrum teams, focus vào integration |
| **Scrum@Scale** | Scale Scrum theo chiều ngang & dọc |
| **Spotify Model** | Tribe/Squad/Chapter/Guild — tự chủ cao |

Claude sẽ tư vấn framework phù hợp khi team/tổ chức muốn scale Agile.

---

### C6. Kanban (bổ sung cho Agile)

**Nguyên tắc cốt lõi**:
1. Visualize workflow (board với cột rõ ràng)
2. Limit WIP (Work In Progress)
3. Manage flow (đo cycle time, lead time)
4. Make policies explicit
5. Implement feedback loops
6. Improve collaboratively

**WIP Limits gợi ý**:
```
To Do:       Không giới hạn (= backlog)
In Progress: ≤ N+1 (N = số thành viên)
In Review:   ≤ 3
Blocked:     Target = 0
```

**Metrics Kanban**:
- **Cycle Time**: Thời gian từ khi bắt đầu đến khi Done
- **Lead Time**: Thời gian từ khi có yêu cầu đến khi Done
- **Throughput**: Số items hoàn thành / tuần

Claude hỗ trợ: Phân tích Jira data để tính cycle time, phát hiện bottleneck theo cột.
