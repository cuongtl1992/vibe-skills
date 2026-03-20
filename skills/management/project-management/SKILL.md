---
name: project-management
description: >
  Trợ lý Project Manager toàn diện, tích hợp Jira & Confluence qua Atlassian MCP.
  Gồm 3 nhóm chức năng:

  [Lập kế hoạch & Tài liệu] Sprint Planning (capacity, Sprint Goal) —
  Roadmap (quý/năm, milestone) — PRD (goals, scope, requirements) —
  User Story (chuẩn INVEST, tạo Jira issue) — Meeting Notes (action items,
  push Jira task) — Risk Register (nhận diện, đánh giá, ứng phó) —
  Resource Planning (phân bổ, over-allocation) — Cost Management
  (ngân sách, CPI/SPI) — Timeline (milestone, critical path).

  [Giám sát & Cảnh báo] Sprint Health Check (6 chỉ số 🟢🟡🔴) —
  Daily Health Check (báo cáo standup tự động) — Cảnh báo quá hạn
  (theo mức nghiêm trọng) — Cảnh báo thiếu thông tin (completeness score).

  [Agile / Scrum / XP] Scrum Ceremonies (Planning, Daily, Review,
  Retro 4 formats, Grooming) — Estimation (Planning Poker, T-Shirt,
  MoSCoW, WSJF) — XP (TDD, Pair Programming, Simple Design) —
  Kanban (WIP, cycle time, bottleneck) — Anti-pattern detection —
  Tạo slide từ Confluence thành file .pptx.
---

# PM Manager Skill

Skill hỗ trợ Project Manager thực hiện toàn bộ tác vụ quản lý dự án,
tích hợp trực tiếp với **Jira & Confluence** qua Atlassian MCP.

> ⚠️ **Bước đầu tiên bắt buộc**: Luôn gọi `getAccessibleAtlassianResources`
> để lấy `cloudId` trước khi thao tác với Jira hoặc Confluence.

---

## Bản đồ tác vụ

### 📋 Quản lý dự án

| # | Tác vụ | Trigger chính | Output |
|---|--------|--------------|--------|
| 1 | Sprint Planning | "lập kế hoạch sprint", "sprint planning" | Confluence page + Jira Sprint |
| 2 | Roadmap | "lập roadmap", "kế hoạch quý" | Confluence page timeline |
| 3 | PRD | "viết PRD", "đặc tả tính năng" | Confluence page |
| 4 | User Stories | "viết user story", "tạo issue" | Jira issues |
| 5 | Meeting Notes | "tổng hợp meeting", "họp xong" | Confluence page + Jira tasks |
| 6 | Risk Register | "rủi ro dự án", "risk register" | Confluence page |
| 7 | Resource Planning | "phân bổ nhân lực", "team capacity" | Confluence page |
| 8 | Cost Management | "ngân sách", "budget", "chi phí" | Confluence page |
| 9 | Timeline | "timeline", "gantt", "milestone" | Confluence page |

### 🏥 Giám sát & Cảnh báo

| # | Tác vụ | Trigger chính | Output |
|---|--------|--------------|--------|
| 10 | Sprint Health Check | "health check sprint", "sprint đang thế nào" | Báo cáo Confluence 🟢🟡🔴 |
| 11 | Daily Task Health Check | "daily check", "task hôm nay" | Báo cáo standup nhanh |
| 12a | Cảnh báo quá hạn | "issue quá hạn", "overdue" | Danh sách ưu tiên theo mức độ |
| 12b | Cảnh báo thiếu thông tin | "missing fields", "completeness" | Completeness score + danh sách fix |

### 📊 Agile / Scrum / XP

| # | Tác vụ | Trigger chính | Output |
|---|--------|--------------|--------|
| 13 | Tạo slide từ wiki | "slide từ Confluence", "tạo pptx" | File .pptx |
| 14 | Scrum Ceremonies | "retro", "review sprint", "grooming" | Confluence + Jira |
| 15 | Agile Estimation | "planning poker", "estimate story" | Điểm + phân tích |
| 16 | Kanban | "WIP limit", "cycle time", "bottleneck" | Phân tích + gợi ý |
| 17 | Anti-pattern detection | mô tả quy trình team | Cảnh báo + đề xuất |

> 📖 Chi tiết Agile/Scrum/XP: [`references/agile-frameworks.md`](references/agile-frameworks.md)
> 📖 Chi tiết Atlassian MCP & JQL: [`references/atlassian-mcp.md`](references/atlassian-mcp.md)

---

## Quy trình thực hiện

```
1. Nhận yêu cầu → Xác định tác vụ (tra bảng trên)
2. Thu thập thông tin còn thiếu (hỏi ngắn gọn)
3. Preview output → xin xác nhận trước khi đẩy lên Jira/Confluence
4. Tạo nội dung & tích hợp
```

**Nguyên tắc hành xử**:
- 🔍 **Preview trước**: Hiển thị nội dung sẽ tạo, hỏi xác nhận trước khi push
- 🔗 **Liên kết chéo**: PRD trên Confluence → tự động link Epic Jira tương ứng
- 🇻🇳 **Tiếng Việt**: Ưu tiên tiếng Việt trong output trừ khi yêu cầu khác
- ⚡ **Chủ động**: Nếu nhận nội dung thô (transcript, ghi chú), tự trích xuất action items / rủi ro / quyết định mà không cần hỏi thêm

---

## Chi tiết từng tác vụ

### 1. Sprint Planning

**Trigger**: "lập kế hoạch sprint", "sprint planning", "tạo sprint"

**Thông tin cần thu thập**:
- Tên Sprint, số thứ tự
- Ngày bắt đầu / kết thúc
- Mục tiêu Sprint (Sprint Goal)
- Danh sách issue/story sẽ đưa vào sprint
- Velocity trung bình của team (nếu có)
- Capacity từng thành viên (ngày làm việc)

**Output → Confluence**: Tạo trang "Sprint [N] Planning" trong không gian Confluence với cấu trúc:

```
# Sprint [N] Planning — [Ngày]

## 🎯 Sprint Goal
[Mục tiêu cụ thể, đo lường được]

## 📅 Timeline
- Start: [ngày]
- End: [ngày]
- Working days: [số ngày]

## 👥 Team Capacity
| Member | Available Days | Points Capacity |
|--------|---------------|-----------------|
| ...    | ...           | ...             |

## 📋 Sprint Backlog
| Story | Points | Assignee | Priority |
|-------|--------|----------|----------|
| ...   | ...    | ...      | ...      |

**Total committed:** [X] points / [Y] story points capacity

## 🚧 Dependencies & Blockers
[Liệt kê]

## ✅ Definition of Done
[Tiêu chí hoàn thành]
```

**Output → Jira**: Tạo Sprint mới và move các issue vào sprint đó.

---

### 2. Roadmap

**Trigger**: "lập roadmap", "kế hoạch quý", "quarterly planning", "product roadmap"

**Thông tin cần thu thập**:
- Thời gian roadmap (Q1/Q2/năm...)
- Các epic/theme lớn
- Milestone quan trọng
- Phụ thuộc giữa các hạng mục

**Output → Confluence**: Trang Roadmap với bảng theo quý:

```
## Roadmap [Năm/Kỳ]

### Mục tiêu chiến lược
[Tóm tắt định hướng]

### Timeline

| Epic / Initiative | Q1 | Q2 | Q3 | Q4 | Owner | Status |
|-------------------|----|----|----|----|-------|--------|
| ...               | 🟩 | 🟩 | ⬜ | ⬜ | ...   | ...    |

Chú thích: 🟩 In Progress / Planned  ✅ Done  ⬜ Not started  🔴 Blocked

### Milestones
| Milestone | Target Date | Dependencies |
|-----------|-------------|--------------|
| ...       | ...         | ...          |
```

---

### 3. PRD (Product Requirements Document)

**Trigger**: "viết PRD", "product requirements", "đặc tả sản phẩm", "tính năng mới"

**Thông tin cần thu thập**:
- Tên tính năng / dự án
- Vấn đề cần giải quyết (Problem Statement)
- Đối tượng người dùng (Target Users)
- Scope trong / ngoài (In/Out of scope)
- Success metrics
- Timeline dự kiến

**Output → Confluence** (dùng template chuẩn):

```
# PRD: [Tên tính năng]

**Status**: Draft | Review | Approved
**Author**: [Tên PM]
**Last Updated**: [Ngày]
**Epic**: [Link Jira Epic]

---

## 1. Problem Statement
[Mô tả rõ ràng vấn đề & tại sao cần giải quyết]

## 2. Goals & Success Metrics
| Goal | Metric | Target |
|------|--------|--------|
| ... | ... | ... |

## 3. User Stories (tóm tắt)
[Link sang Jira hoặc liệt kê các story chính]

## 4. Scope
**In Scope**: ...
**Out of Scope**: ...

## 5. Requirements
### Functional Requirements
[Danh sách yêu cầu chức năng]

### Non-Functional Requirements
- Performance: ...
- Security: ...
- Scalability: ...

## 6. Design & Technical Notes
[Link Figma, Tech Spec nếu có]

## 7. Timeline
| Phase | Duration | Deliverable |
|-------|----------|-------------|
| ... | ... | ... |

## 8. Risks & Mitigation
[Xem Risk Register liên quan]

## 9. Open Questions
- [ ] ...
```

---

### 4. User Stories

**Trigger**: "viết user story", "tạo story", "tạo issue", "acceptance criteria"

**Format chuẩn**:
```
**As a** [loại người dùng],
**I want to** [hành động / tính năng],
**So that** [lợi ích / giá trị đạt được].

**Acceptance Criteria**:
- [ ] Given [bối cảnh], When [hành động], Then [kết quả]
- [ ] ...

**Story Points**: [1 / 2 / 3 / 5 / 8 / 13]
**Priority**: Critical / High / Medium / Low
```

**Output → Jira**: Tạo issue loại "Story" với description theo format trên, gán epic, label, assignee nếu có.

Nếu người dùng cung cấp một tính năng/PRD, tự động tách thành nhiều User Stories nhỏ theo nguyên tắc INVEST:
- **I**ndependent, **N**egotiable, **V**aluable, **E**stimable, **S**mall, **T**estable

---

### 5. Meeting Notes & Action Items

**Trigger**: "tổng hợp meeting", "họp xong", "ghi lại cuộc họp", "meeting notes", "action items"

**Thông tin cần thu thập**:
- Tên cuộc họp, ngày/giờ
- Người tham dự
- Nội dung thảo luận (paste transcript hoặc ghi chú thô)
- Quyết định đã đưa ra

**Output → Confluence**:

```
# Meeting Notes — [Tên cuộc họp] | [Ngày]

**Attendees**: [Danh sách]
**Facilitator**: [Tên]
**Note taker**: [Tên]

---

## 📋 Agenda & Discussion

### [Chủ đề 1]
- [Tóm tắt điểm thảo luận]
- **Quyết định**: [Nếu có]

### [Chủ đề 2]
...

---

## ✅ Action Items

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | ... | ... | ... | Open |
| 2 | ... | ... | ... | Open |

---

## 🔜 Next Meeting
- **Ngày**: [...]
- **Agenda dự kiến**: [...]
```

**Output → Jira**: Tự động tạo các Jira task cho từng action item (nếu người dùng xác nhận).

---

### 6. Risk Register

**Trigger**: "risk register", "quản lý rủi ro", "rủi ro dự án", "risk assessment", "liệt kê rủi ro"

**Thông tin cần thu thập**:
- Tên dự án / sprint
- Danh sách rủi ro đã biết (hoặc Claude sẽ gợi ý dựa trên context)

**Output → Confluence**:

```
# Risk Register — [Tên Dự án]

**Cập nhật lần cuối**: [Ngày]
**Owner**: [PM]

## Ma trận rủi ro

| ID | Rủi ro | Khả năng xảy ra | Mức độ ảnh hưởng | Risk Score | Chiến lược xử lý | Owner | Trạng thái |
|----|--------|-----------------|------------------|------------|-------------------|-------|------------|
| R1 | ... | Cao/Trung/Thấp | Cao/Trung/Thấp | ... | Avoid/Mitigate/Transfer/Accept | ... | Open |

## Chi tiết từng rủi ro

### R1: [Tên rủi ro]
- **Mô tả**: ...
- **Trigger**: Dấu hiệu nhận biết khi rủi ro xảy ra
- **Kế hoạch ứng phó**: ...
- **Contingency**: Nếu rủi ro xảy ra, sẽ làm gì
```

**Risk Score** = Khả năng × Mức độ (thang 1-5):
- 1-4: Thấp 🟢 | 5-9: Trung bình 🟡 | 10-25: Cao 🔴

---

### 7. Resource Planning

**Trigger**: "resource planning", "phân bổ nhân lực", "ai làm gì", "team capacity", "nguồn lực"

**Thông tin cần thu thập**:
- Danh sách thành viên và role
- Thời gian có thể làm việc (ngày/tuần)
- Các dự án / sprint đang song song
- Kỹ năng chuyên biệt cần thiết

**Output → Confluence**:

```
# Resource Plan — [Tên Dự án / Sprint]

## Team Overview
| Member | Role | Skill | Availability (%) | Allocated Project |
|--------|------|-------|-----------------|-------------------|
| ...    | ...  | ...   | ...             | ...               |

## Allocation Matrix (theo tuần)
| Member | Week 1 | Week 2 | Week 3 | Week 4 | Total |
|--------|--------|--------|--------|--------|-------|
| ...    | X%     | X%     | X%     | X%     | ...   |

## Cảnh báo Over-allocation
[Liệt kê thành viên bị overload > 100%]

## Gap Analysis
[Kỹ năng / nhân lực còn thiếu]
```

---

### 8. Cost Management

**Trigger**: "quản lý chi phí", "budget", "ngân sách", "cost tracking", "chi phí dự án"

**Thông tin cần thu thập**:
- Tổng ngân sách dự án
- Các hạng mục chi phí (nhân lực, công cụ, vendor, ...)
- Chi phí thực tế đến hiện tại

**Output → Confluence**:

```
# Budget Tracker — [Tên Dự án]

## Tóm tắt ngân sách
| Hạng mục | Budget | Actual | Forecast | Variance | Status |
|----------|--------|--------|----------|----------|--------|
| Nhân lực | ... | ... | ... | ... | 🟢/🟡/🔴 |
| Công cụ  | ... | ... | ... | ... | ... |
| **Total**| ...  | ...  | ...      | ...      | ...    |

## Chi tiết nhân lực
| Member | Rate | Days Planned | Days Actual | Cost Planned | Cost Actual |
|--------|------|-------------|------------|--------------|-------------|
| ... | ... | ... | ... | ... | ... |

## Cost Variance Analysis
- **CPI** (Cost Performance Index): [Actual/Budget]
- **SPI** (Schedule Performance Index): [nếu có earned value]
- **Nhận xét**: [Phân tích nguyên nhân chênh lệch]

## Forecast to Complete
[Dự báo chi phí đến khi hoàn thành]
```

---

### 9. Timeline Management

**Trigger**: "timeline", "gantt", "milestone", "lịch dự án", "schedule", "deadline"

**Thông tin cần thu thập**:
- Các phase/milestone chính
- Ngày bắt đầu / kết thúc từng phase
- Dependencies giữa các task
- Buffer time dự kiến

**Output → Confluence**: Bảng timeline + phân tích critical path

```
# Project Timeline — [Tên Dự án]

## Milestones
| Milestone | Target Date | Owner | Status | Notes |
|-----------|-------------|-------|--------|-------|
| Kickoff   | ...         | ...   | ✅     | ...   |
| MVP       | ...         | ...   | 🔄     | ...   |
| Go-live   | ...         | ...   | ⏳     | ...   |

## Phase Breakdown
| Phase | Start | End | Duration | Dependencies | Owner |
|-------|-------|-----|----------|-------------|-------|
| ...   | ...   | ... | X days   | ...         | ...   |

## Critical Path
[Liệt kê chuỗi task dài nhất ảnh hưởng đến deadline]

## Schedule Health
- **Tổng thời gian còn lại**: X ngày
- **Buffer còn lại**: X ngày (X%)
- **Rủi ro trễ deadline**: 🟢 Thấp / 🟡 Trung bình / 🔴 Cao
```

---

### 10. Sprint Health Check

**Trigger**: "health check sprint", "sprint đang thế nào", "tình trạng sprint", "sprint status", "review sprint", "sprint có vấn đề gì không"

**Thông tin cần thu thập**:
- Tên project / sprint cần check (hoặc lấy sprint đang active)

**Quy trình**:
1. Gọi Jira lấy tất cả issues trong sprint hiện tại (`sprint in openSprints()`)
2. Phân tích theo các chỉ số bên dưới
3. Tạo báo cáo Health Check lên Confluence

**Chỉ số đánh giá**:

| Chỉ số | Tốt 🟢 | Cảnh báo 🟡 | Nguy hiểm 🔴 |
|--------|--------|------------|--------------|
| % Story hoàn thành | ≥ tiến độ thời gian | Chênh lệch < 20% | Chênh lệch ≥ 20% |
| Số issue blocked | 0 | 1–2 | ≥ 3 |
| Số issue chưa assign | 0 | 1–2 | ≥ 3 |
| Số issue chưa estimate | 0 | < 10% | ≥ 10% |
| Scope creep (issue thêm giữa sprint) | 0 | 1–2 | ≥ 3 |
| Story point còn lại vs. ngày còn lại | Cân đối | Hơi lệch | Lệch nhiều |

**Output → Confluence**:

```
# 🏥 Sprint Health Check — [Sprint Name] | [Ngày]

## Tổng quan
| Chỉ số | Giá trị | Trạng thái |
|--------|---------|------------|
| Ngày đã qua / Tổng ngày | X / Y ngày | ... |
| Story points done / total | X / Y pts | 🟢/🟡/🔴 |
| Issues Done / Total | X / Y | ... |
| Velocity dự báo | X pts | ... |

## ⚠️ Vấn đề phát hiện
- 🔴 [Mô tả vấn đề nghiêm trọng + link issue Jira]
- 🟡 [Cảnh báo + đề xuất xử lý]

## 📋 Chi tiết theo trạng thái
| Status | Số lượng | Story Points |
|--------|----------|-------------|
| To Do | ... | ... |
| In Progress | ... | ... |
| In Review | ... | ... |
| Done | ... | ... |
| Blocked | ... | ... |

## 🎯 Khuyến nghị
1. [Hành động cụ thể cần làm ngay]

## 📈 Dự báo kết quả Sprint
- **Lạc quan**: Hoàn thành X% mục tiêu
- **Thực tế**: Hoàn thành Y% mục tiêu
- **Rủi ro**: [Mô tả nếu sprint có nguy cơ fail]
```

---

### 11. Daily Task Health Check

**Trigger**: "daily check", "kiểm tra task hôm nay", "task nào đang có vấn đề", "standup report", "báo cáo daily", "task health"

**Quy trình**:
1. Lấy tất cả issues `In Progress` trong sprint active
2. Kiểm tra từng issue theo các tiêu chí bên dưới
3. Tạo báo cáo nhanh dùng trong Daily Standup

**Tiêu chí cảnh báo cho từng task**:
- 🔴 **Quá hạn**: Due date đã qua mà chưa Done
- 🔴 **In Progress quá lâu**: Task ở In Progress > 3 ngày không cập nhật
- 🟡 **Thiếu assignee**: Issue không có người phụ trách
- 🟡 **Thiếu due date**: Issue In Progress mà không có deadline
- 🟡 **Thiếu story points**: Chưa estimate
- 🟡 **Blocked chưa giải thích**: Có label Blocked mà không có comment
- ⚪ **Không có activity**: Không có comment/update trong 24h

**Output** (hiển thị trong chat + tùy chọn lưu Confluence):

```
# 📋 Daily Health Check — [Ngày]  Sprint: [Tên]

### 🔴 Cần xử lý ngay
| Issue | Vấn đề | Assignee | Due Date |
|-------|---------|----------|----------|
| KEY-123 Tên task | Quá hạn 2 ngày | @Nam | 15/03 |
| KEY-145 Tên task | In Progress 5 ngày, không update | @Mai | - |

### 🟡 Cần chú ý
| Issue | Vấn đề | Đề xuất |
|-------|---------|---------|
| KEY-130 | Thiếu due date | Thêm deadline |
| KEY-132 | Blocked, chưa có giải pháp | Comment hướng xử lý |

### ✅ Đang tiến triển tốt
KEY-120, KEY-125, KEY-128: Đúng tiến độ

### 📣 Gợi ý cho Standup hôm nay
- Ưu tiên unblock KEY-145 — đã bị block 2 ngày
- Confirm due date cho KEY-130 trước EOD
```

---

### 12. Cảnh báo Quá hạn & Thiếu thông tin

**Trigger**: "cảnh báo deadline", "issue nào quá hạn", "thiếu thông tin", "missing fields", "overdue", "issue chưa đủ thông tin", "kiểm tra completeness"

#### 12a. Cảnh báo quá hạn
Lấy issues với JQL: `project = [KEY] AND due < now() AND status != Done`

```
## ⏰ Danh sách Quá hạn — [Project] | [Ngày]

| Mức độ | Issue | Tiêu đề | Assignee | Due Date | Trễ (ngày) |
|--------|-------|---------|----------|----------|------------|
| 🔴 Nghiêm trọng | KEY-12 | ... | @Nam | 10/03 | 8 ngày |
| 🟡 Cảnh báo | KEY-34 | ... | @Mai | 14/03 | 4 ngày |

Tổng: X issues quá hạn | Nghiêm trọng: X | Cảnh báo: X
```

#### 12b. Cảnh báo thiếu thông tin
Kiểm tra các trường bắt buộc theo loại issue:

| Loại Issue | Trường bắt buộc kiểm tra |
|------------|--------------------------|
| Story | Assignee, Story Points, Due Date, Acceptance Criteria, Epic link |
| Task | Assignee, Due Date, Description |
| Bug | Assignee, Priority, Steps to Reproduce, Severity |
| Epic | Owner, Target Date, Description |

```
## ⚠️ Thiếu thông tin — [Project]

| Issue | Loại | Thiếu trường | Hành động |
|-------|------|-------------|-----------|
| KEY-23 | Story | Story Points, AC | Cần estimate & viết AC |
| KEY-45 | Bug | Steps to Reproduce | Dev cần bổ sung |
| KEY-67 | Task | Assignee | PM cần assign |

Completeness Score: X% (Y/Z issues đầy đủ thông tin)
```

Sau khi hiển thị, hỏi: "Bạn có muốn tôi tạo Jira task reminder cho từng vấn đề không?"

---

### 13. Tạo Slide từ Wiki/Confluence

**Trigger**: "tạo slide từ wiki", "tạo presentation từ Confluence", "xuất slide", "làm deck từ trang Confluence", "convert wiki sang powerpoint", "tạo pptx từ", "slide từ"

**Thông tin cần thu thập**:
- URL hoặc tên trang Confluence cần chuyển thành slide
- Mục đích buổi trình bày (nội bộ / khách hàng / stakeholder)
- Số slide tối đa (mặc định: chia hợp lý theo nội dung)
- Có cần speaker notes không?
- Màu chủ đạo (mặc định: xanh Atlassian #0052CC)

**Quy trình**:
1. Lấy nội dung trang Confluence qua `getConfluencePage`
2. Phân tích cấu trúc heading → slide
3. Tạo file `.pptx` bằng `python-pptx`
4. Xuất file → `present_files` để người dùng tải về

**Nguyên tắc chuyển đổi Wiki → Slide**:

| Yếu tố Wiki | Chuyển thành |
|-------------|-------------|
| Tiêu đề trang | Slide 1: Title slide |
| Heading H1 | Slide mới: Section divider |
| Heading H2 | Slide mới: Content slide |
| Heading H3 | Bullet point hoặc sub-slide |
| Bảng (table) | Slide bảng / so sánh |
| Danh sách | Bullets (tối đa 5 bullets/slide) |
| Đoạn văn dài | Tóm tắt thành 3–5 key points |
| Code block | Slide code với font monospace |

**Cấu trúc slide mặc định**:
```
Slide 1:    [Title] — Tên trang + Ngày + Author
Slide 2:    [Agenda] — Danh sách các mục chính
Slide 3..N: [Section + Content] — Theo cấu trúc Heading
Slide cuối: [Next Steps / Q&A]
```

**Kỹ thuật tạo PPTX**:
- Dùng `python-pptx` (`pip install python-pptx`)
- Font: Calibri (heading 36pt bold, body 20pt)
- Theme màu: accent color theo yêu cầu người dùng
- Layouts: Title Slide, Section Header, Bullet Content, Table, Blank
- Nếu speaker notes được yêu cầu: thêm nội dung chi tiết hơn từ wiki gốc vào notes của mỗi slide



