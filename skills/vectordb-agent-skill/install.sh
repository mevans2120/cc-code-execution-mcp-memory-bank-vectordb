#!/bin/bash
# Vector DB Agent Skill Installation Script

SKILL_NAME="vectordb"
SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
SOURCE_DIR="$(dirname "$(readlink -f "$0")")"

echo "🚀 Installing Vector DB Agent Skill..."

# Check if Claude skills directory exists
if [ ! -d "$HOME/.claude/skills" ]; then
    echo "Creating Claude skills directory..."
    mkdir -p "$HOME/.claude/skills"
fi

# Check if skill already exists
if [ -d "$SKILL_DIR" ]; then
    echo "⚠️  Skill already exists at $SKILL_DIR"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
    rm -rf "$SKILL_DIR"
fi

# Copy skill files
echo "Copying skill files..."
cp -r "$SOURCE_DIR" "$SKILL_DIR"

# Make scripts executable
chmod +x "$SKILL_DIR/scripts/"*.ts 2>/dev/null

# Verify installation
if [ -f "$SKILL_DIR/SKILL.md" ]; then
    echo "✅ Vector DB skill installed successfully!"
    echo ""
    echo "The skill is now available to agents. Try saying:"
    echo "  • 'search vector db for authentication patterns'"
    echo "  • 'find examples of error handling'"
    echo "  • 'what patterns exist for API design'"
    echo ""
    echo "Make sure ChromaDB is running:"
    echo "  cd ~/claude-code-vectordb && npm run chromadb:start"
else
    echo "❌ Installation failed. Please check permissions and try again."
    exit 1
fi