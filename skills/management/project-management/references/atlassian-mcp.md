# Atlassian MCP — Tham chiếu kỹ thuật

## Lấy Cloud ID (bước đầu tiên bắt buộc)
```
Gọi: getAccessibleAtlassianResources
→ Lấy cloudId từ kết quả trả về, dùng cho mọi lệnh tiếp theo
```

## Confluence

### Tạo trang mới
```
Gọi: createConfluencePage
- spaceId: [ID không gian làm việc]
- title: [Tiêu đề trang]
- parentId: [ID trang cha nếu có]
- body: [Nội dung Markdown hoặc HTML]
```

### Lấy nội dung trang
```
Gọi: getConfluencePage
- pageId: [ID trang]
→ Trả về body content, dùng để tạo slide hoặc phân tích
```

### Cập nhật trang hiện có
```
Gọi: updateConfluencePage
- pageId, version, title, body
```

### Tìm kiếm trang
```
Gọi: searchConfluenceUsingCql
- CQL: title = "Sprint 12 Planning" AND space = "PROJ"
```

## Jira

### Tạo issue
```
Gọi: createJiraIssue
- projectKey: [Key dự án, vd: "PROJ"]
- issueType: Story / Task / Bug / Epic
- summary: [Tiêu đề ngắn]
- description: [Nội dung chi tiết — hỗ trợ Markdown]
- labels, assignee, priority, dueDate: [Nếu có]
```

### Tìm kiếm issues (JQL thường dùng)
```
Gọi: searchJiraIssuesUsingJql

# Sprint đang active
project = PROJ AND sprint in openSprints()

# Issues quá hạn
project = PROJ AND due < now() AND status != Done

# Issues thiếu assignee
project = PROJ AND assignee is EMPTY AND status != Done

# Issues In Progress lâu
project = PROJ AND status = "In Progress" AND updated < -3d

# Issues bị blocked
project = PROJ AND labels = blocked
```

### Transition (thay đổi trạng thái)
```
Gọi: getTransitionsForJiraIssue → lấy danh sách transition
Gọi: transitionJiraIssue → thực hiện transition
```

### Thêm comment
```
Gọi: addCommentToJiraIssue
- issueKey: KEY-123
- body: [Nội dung comment]
```

## JQL Health Check Queries

### Sprint Health Check
```jql
-- Tất cả issues trong sprint active
project = {KEY} AND sprint in openSprints() ORDER BY status ASC

-- Issues blocked
project = {KEY} AND sprint in openSprints() AND labels = blocked

-- Chưa estimate
project = {KEY} AND sprint in openSprints() AND story_points is EMPTY

-- Scope creep (thêm sau khi sprint bắt đầu)
project = {KEY} AND sprint in openSprints() AND created > {sprintStartDate}
```

### Daily Health Check
```jql
-- In Progress issues
project = {KEY} AND sprint in openSprints() AND status = "In Progress"

-- Không có activity 24h
project = {KEY} AND sprint in openSprints() AND updated < -1d AND status != Done
```
