# Data Processing Patterns Guide

This document provides guidance on when to use Expression nodes versus other approaches for different data processing scenarios.

## Expression Node Patterns

### Well-Suited Patterns ✅

The Expression node is the recommended approach for most inline processing tasks:

#### 1. Arithmetic Operations
```
Pattern: Mathematical calculations and numeric transformations
Example: "(price * quantity) * (1 + taxRate)"

When to use:
- Simple calculations
- Formula-based transformations
- Percentage calculations
- Unit conversions

Sample Expression nodes:
- "(in0 + in1) / 2" - Average of two numbers
- "in0 * 0.85" - Apply 15% discount
- "(tempF - 32) * 5/9" - Fahrenheit to Celsius
```

#### 2. String Manipulation
```
Pattern: String concatenation, formatting, and transformations
Example: "firstName + ' ' + lastName"

When to use:
- Concatenating strings
- Building formatted messages
- String case conversions
- Template-like string building

Sample Expression nodes:
- "'Hello, ' + in0" - Greeting message
- "in0.toUpperCase()" - Convert to uppercase (CEL function)
- "'Order #' + string(orderId)" - Format order number
```

#### 3. Boolean Logic
```
Pattern: Conditional checks and boolean expressions
Example: "age >= 18 && hasLicense"

When to use:
- Validation rules
- Access control checks
- Filtering conditions
- Eligibility determination

Sample Expression nodes:
- "in0 > 100 && in1 < 200" - Range check
- "status == 'active' || isAdmin" - Status or permission check
- "!(isDeleted || isArchived)" - Not deleted and not archived
```

#### 4. Property Access
```
Pattern: Accessing nested object properties
Example: "user.address.city"

When to use:
- Extracting values from objects
- Navigating nested structures
- Accessing array elements
- Dot notation access

Sample Expression nodes:
- "in0.user.email" - Extract email from user object
- "in0.items[0].name" - Get first item's name
- "config.settings.timeout" - Access nested config value
```

#### 5. Ternary Conditions
```
Pattern: Simple conditional value selection
Example: "score > 90 ? 'A' : 'B'"

When to use:
- Simple if-then-else logic
- Default value assignment
- Status determination
- Label selection

Sample Expression nodes:
- "in0 > 0 ? 'positive' : 'non-positive'" - Sign check
- "count == 1 ? 'item' : 'items'" - Singular/plural
- "in0 != null ? in0 : 'N/A'" - Default value
```

#### 6. Array Operations (with Map/Filter/Reduce)
```
Pattern: Array element transformations and filtering
Example Filter: "element.status == 'active'"
Example Map: "element * 2"

When to use:
- Filtering array elements
- Transforming each element
- Extracting properties from objects
- Computing derived values

Sample Expression nodes (used with Map/Filter):
- "element > 5" - Filter numbers greater than 5
- "element.price * 1.1" - Add 10% to all prices
- "element.toLowerCase()" - Convert all strings to lowercase
```

### Moderately Suited Patterns ⚠️

These patterns can work with Expression nodes but may benefit from alternative approaches:

#### 7. Multi-Step Transformations
```
Challenge: Complex calculations requiring intermediate results
Recommendation: Chain multiple Expression nodes

Example:
Value(price) → Expression("in0 * 1.2") → Expression("in0 * quantity") → Output
                  (add tax)                     (multiply by qty)

Alternative: Break into logical steps with clear intermediate values
```

#### 8. Complex Conditional Logic
```
Challenge: Multiple nested conditions
Recommendation: Use If/Switch nodes or break into smaller Expression nodes

Example - Instead of:
Expression("in0 > 100 ? (in1 == 'premium' ? price * 0.8 : price * 0.9) : price")

Consider:
Value → Expression("in0 > 100") → If → Output
                                     ├─ true → Expression based on type
                                     └─ false → original price
```

#### 9. Type Conversions
```
Pattern: Converting between data types
Example: "string(in0)" or "int(in0)"

When to use:
- Converting numbers to strings
- Parsing strings to numbers
- Type casting for operations

Note: CEL has limited type conversion functions. For complex conversions,
consider using dedicated transformation nodes.

Sample Expression nodes:
- "string(in0)" - Number to string
- "int(in0)" - String to integer
- "double(in0)" - Convert to double
```

### Not Suitable Patterns ❌

These patterns require dedicated nodes or custom implementations:

#### 10. Date/Time Operations
```
Why not Expression node:
- Date arithmetic requires special handling
- Timezone conversions need library support
- Formatting has many options

Use instead: CreateDate, AddDate, FormatDate nodes

Example:
DateString → CreateDate → AddDate(days: 7) → FormatDate(format: 'iso') → Output
```

#### 11. External API Calls
```
Why not Expression node:
- CEL expressions are pure and cannot make HTTP requests
- Async operations not supported in expressions
- Authentication and error handling required

Use instead: Custom API node (requires implementation)

Workaround:
1. Pre-fetch data before graph execution
2. Pass API results as input data
3. Use Expression nodes to process results
```

#### 12. Stateful Operations
```
Why not Expression node:
- Expressions are stateless
- Cannot accumulate state across evaluations
- No persistent storage

Examples of stateful operations:
- Counters
- Accumulators
- Session management
- Cache management

Use instead:
- Reduce node for accumulation
- Custom nodes for complex state
- External state management
```

#### 13. Complex Regular Expressions
```
Why not Expression node:
- CEL has limited regex support
- Complex patterns can be hard to read in inline expressions
- May need different regex flavors

Use instead: Custom string processing node

Workaround: For simple patterns, use CEL's matches() function:
Expression("in0.matches('[A-Z][0-9]{5}')")
```

#### 14. Database Operations
```
Why not Expression node:
- No database connectivity in CEL
- Query execution requires async operations
- Transaction management needed

Use instead: Custom database node

Workaround:
1. Query data before graph execution
2. Pass query results as input
3. Use Expression nodes for data processing
```

#### 15. File I/O Operations
```
Why not Expression node:
- CEL expressions cannot read/write files
- File system access requires OS permissions
- Binary data handling not supported

Use instead: Custom file processing node

Workaround:
1. Load file contents before execution
2. Pass data as input
3. Return processed data for external file writing
```

## Pattern Decision Tree

```
Need to process data?
│
├─ Simple calculation? → Use Expression node
│   Examples: math, string concat, boolean logic
│
├─ Array transformation? → Use Map/Filter with Expression
│   Examples: transform elements, filter by condition
│
├─ Date/time operation? → Use DateTime nodes
│   Examples: create date, add days, format
│
├─ Object creation? → Use CreateObject node
│   Example: combine values into object
│
├─ Complex multi-step? → Chain Expression nodes
│   Example: multiple transformations with intermediate results
│
├─ Conditional routing? → Use If/Switch nodes
│   Example: route to different outputs based on condition
│
└─ External interaction? → Use custom node (or workaround)
    Examples: API calls, database, file I/O
```

## Best Practices

### 1. Keep Expressions Simple
```
✅ Good: "(in0 + in1) * 2"
❌ Avoid: "((in0 + in1) * (in2 - in3)) / ((in4 + in5) * (in6 - in7))"

For complex calculations, break into multiple nodes.
```

### 2. Use Descriptive Names
```
✅ Good: Custom pin names like "price", "quantity", "taxRate"
❌ Avoid: Generic names like "in0", "in1", "in2" for complex expressions

Configure custom pin names for CreateObject and important Expression nodes.
```

### 3. Document Complex Expressions
```
✅ Good: Add node description or comment
Expression: "in0 > threshold && status == 'active'"
Description: "Check if value exceeds threshold and is active"

Use node labels to explain purpose.
```

### 4. Test with Sample Data
```
✅ Always test expressions with sample input data
✅ Verify edge cases (null, zero, empty strings)
✅ Use the Interactive Console to validate

The CEL Console allows testing expressions before integration.
```

### 5. Leverage CEL Functions
```
Available CEL functions:
- string() - type conversion
- size() - get size of string/array/map
- matches() - regex matching
- contains() - substring check
- startsWith() / endsWith() - string checks
- type() - get type name

Example: "size(in0) > 0 && in0.startsWith('PREFIX')"
```

## Example Workflows

### Example 1: E-commerce Price Calculation
```
Product → Expression("in0.basePrice * in0.quantity") → 
          Expression("in0 * (1 + taxRate)") →
          Expression("in0 > 100 ? in0 * 0.9 : in0") →
          CreateObject(subtotal, tax, total) → Output
```

### Example 2: User Eligibility Check
```
Input(user) → Expression("in0.age >= 18") → If
                                             ├─ true → Expression("'Eligible'")
                                             └─ false → Expression("'Not eligible'")
              → Output
```

### Example 3: Data Filtering and Transformation
```
Input(items) → Filter(expression: "element.status == 'active'") →
               Map(expression: "element.price * 1.1") →
               Output
```

## Conclusion

The Expression node is the primary tool for inline data processing in Expression-eval. It handles most common scenarios effectively while maintaining clean, readable graphs. For operations that don't fit the Expression pattern, use dedicated nodes (like DateTime nodes) or consider implementing custom nodes for specialized requirements.

When in doubt:
1. Try Expression node first
2. Break complex logic into smaller Expression nodes
3. Use dedicated nodes for domain-specific operations (dates, etc.)
4. Document your expressions for maintainability
