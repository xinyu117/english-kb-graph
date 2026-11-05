
const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "english_learning_categories_bilingual.csv");
const outputFile = path.join(__dirname, "categories_with_level.csv");

// 读取 CSV
const content = fs.readFileSync(inputFile, "utf-8")
    .replace(/^\uFEFF/, "")
    .trim();

// 解析 CSV（适用于当前无复杂引号的格式）
const lines = content.split(/\r?\n/);

const headers = lines[0].split(",");

const rows = lines.slice(1).map(line => {
    const values = line.split(",");
    return Object.fromEntries(
        headers.map((header, index) => [
            header.trim(),
            (values[index] || "").trim()
        ])
    );
});

// 建立分类映射：code -> parentCode
const categoryMap = new Map();

for (const row of rows) {
    categoryMap.set(
        row.subcategory_code,
        row.category_code
    );
}

// 递归计算分类层级
function getLevel(code, visited = new Set()) {

    if (!code) {
        return 0;
    }

    // 检查循环引用
    if (visited.has(code)) {
        throw new Error(`检测到分类循环引用: ${code}`);
    }

    // 检查分类是否存在
    if (!categoryMap.has(code)) {
        throw new Error(`找不到父分类: ${code}`);
    }

    visited.add(code);

    const parentCode = categoryMap.get(code);

    // 根分类
    if (!parentCode) {
        return 0;
    }

    return getLevel(parentCode, visited) + 1;
}

// 计算 level
for (const row of rows) {
    row.level = getLevel(row.subcategory_code);
}

// 生成 CSV
const outputHeaders = [...headers, "level"];

const outputLines = [
    outputHeaders.join(","),
    ...rows.map(row =>
        outputHeaders.map(header => row[header]).join(",")
    )
];

// 写入文件
fs.writeFileSync(
    outputFile,
    outputLines.join("\n") + "\n",
    "utf-8"
);

console.log(`处理完成: ${outputFile}`);
