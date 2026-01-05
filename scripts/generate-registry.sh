#!/bin/bash

# Generate registry.json from SKILL.md files
# Usage: ./scripts/generate-registry.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$ROOT_DIR/skills"
OUTPUT_FILE="$SKILLS_DIR/registry.json"

echo "Scanning skills in $SKILLS_DIR..."

# Start JSON
echo '{' > "$OUTPUT_FILE"
echo '  "version": "1.0",' >> "$OUTPUT_FILE"
echo '  "skills": [' >> "$OUTPUT_FILE"

first=true
skill_count=0

for skill_file in $(find "$SKILLS_DIR" -name "SKILL.md" -type f | sort); do
  # Extract stack and name from path
  # skills/common/commit-convention/SKILL.md -> stack=common, name=commit-convention
  relative_path="${skill_file#$SKILLS_DIR/}"
  stack=$(echo "$relative_path" | cut -d'/' -f1)
  name=$(echo "$relative_path" | cut -d'/' -f2)
  path="${relative_path%/SKILL.md}/SKILL.md"

  # Extract description from first non-empty, non-header line
  description=$(grep -v '^#' "$skill_file" | grep -v '^$' | grep -v '^\`\`\`' | head -1 | sed 's/"/\\"/g' | cut -c1-100)

  if [ "$first" = true ]; then
    first=false
  else
    echo ',' >> "$OUTPUT_FILE"
  fi

  # Write skill entry (without trailing newline for comma handling)
  printf '    {\n' >> "$OUTPUT_FILE"
  printf '      "name": "%s",\n' "$name" >> "$OUTPUT_FILE"
  printf '      "stack": "%s",\n' "$stack" >> "$OUTPUT_FILE"
  printf '      "description": "%s",\n' "$description" >> "$OUTPUT_FILE"
  printf '      "path": "%s"\n' "$path" >> "$OUTPUT_FILE"
  printf '    }' >> "$OUTPUT_FILE"

  skill_count=$((skill_count + 1))
  echo "  Found: $stack/$name"
done

# Close JSON
echo '' >> "$OUTPUT_FILE"
echo '  ]' >> "$OUTPUT_FILE"
echo '}' >> "$OUTPUT_FILE"

echo ""
echo "Generated $OUTPUT_FILE with $skill_count skill(s)"
