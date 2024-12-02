# User Acceptance Testing Plan

## Test Plan 1: Science Debate with Logical Larry

### Test Objective
Verify the debate functionality, scoring system, and logging mechanisms using a technically-focused AI personality in a science-based debate.

### Test Subject
- Topic: "Artificial intelligence should be strictly regulated" (SCI004)
- AI Opponent: Logical Larry
- Expected Debate Style: Fact-based, analytical arguments

### Test Steps

1. Game Initialization
   - Navigate to game setup screen
   - Select "Science" category
   - Choose topic SCI004
   - Select Logical Larry as opponent
   - Expected: Game should load with correct topic and AI personality

2. Initial Interaction
   - Send first message presenting argument about AI safety regulations
   - Expected: 
     - Larry responds with fact-based counterpoints
     - Response appears within reasonable timeframe
     - Message is logged in api_logs/debate_message.log

3. Technical Discussion Phase
   - Send message about specific AI regulation frameworks
   - Expected:
     - Larry's response includes technical vocabulary
     - Scoring reflects logical consistency
     - Arguments maintain analytical focus

4. Evidence-Based Exchange
   - Present statistical evidence about AI risks
   - Expected:
     - Larry engages with the statistics
     - Response demonstrates analytical trait
     - Scoring system rewards evidence-based arguments

5. Log Verification
   - Check api_logs/debate_message.log
   - Verify entries for:
     - Message content
     - Timestamps
     - Scoring calculations
     - AI response generation

6. Game Conclusion
   - End the debate
   - Expected:
     - Summary screen appears
     - Scoring breakdown visible
     - Debate history accessible
     - All interactions logged

### Verification Points

#### Scoring System
- [ ] Each message receives appropriate score based on:
  - Logical consistency
  - Evidence usage
  - Argument structure
  - Technical accuracy

#### AI Personality
- [ ] Larry maintains logical personality traits:
  - Fact-based arguments
  - Formal vocabulary
  - Statistical examples
  - Analytical debate strategy

#### Technical Requirements
- [ ] All interactions logged properly
- [ ] Response times within acceptable range
- [ ] No UI/UX glitches during debate
- [ ] Score calculations accurate and consistent

### Success Criteria
1. Complete debate session without technical issues
2. All messages properly logged and scored
3. AI responses align with Logical Larry's personality
4. End game summary accurately reflects debate quality
5. Scoring system shows clear correlation with argument quality

### Notes
- Document any unexpected AI responses
- Note any scoring anomalies
- Record response times for performance analysis
- Screenshot key interactions for documentation

## Test Plan 2: Religion Debate with Devil's Advocate Dan

### Test Objective
Verify the debate system's ability to handle controversial topics and maintain consistent challenging responses while properly scoring and logging contrarian arguments.

### Test Subject
- Topic: "All religions are equally valid paths to the same truth" (REL003)
- AI Opponent: Devil's Advocate Dan
- Expected Debate Style: Contrarian, challenging, provocative

### Test Steps

1. Game Initialization
   - Navigate to game setup screen
   - Select "Religion" category
   - Choose topic REL003
   - Select Devil's Advocate Dan as opponent
   - Expected: Game loads with appropriate religious debate context

2. Initial Position Statement
   - Send first message supporting religious pluralism
   - Expected:
     - Dan challenges the fundamental premise
     - Response demonstrates contrarian trait
     - Message logged in debate_message.log

3. Multi-Faith Discussion
   - Present examples from different religious traditions
   - Expected:
     - Dan questions compatibility claims
     - Response maintains provocative style
     - Scoring reflects quality of counterarguments

4. Philosophical Exchange
   - Address concept of ultimate truth across religions
   - Expected:
     - Dan presents opposing philosophical frameworks
     - Hypothetical scenarios challenge assumptions
     - Scoring accounts for debate complexity

5. Log Analysis
   - Check message_scoring.log
   - Verify entries for:
     - Contrarian responses
     - Challenge patterns
     - Scoring adaptations
     - Debate progression

6. Game Conclusion
   - End the debate
   - Expected:
     - Summary captures argumentative nature
     - Scoring reflects back-and-forth dynamic
     - Complete debate history available
     - All challenges properly logged

### Verification Points

#### Scoring System
- [ ] Each message scored based on:
  - Argument strength
  - Response to challenges
  - Evidence presentation
  - Logical consistency

#### AI Personality
- [ ] Dan maintains contrarian traits:
  - Consistent challenging
  - Provocative vocabulary
  - Hypothetical scenarios
  - Devil's advocate approach

#### Technical Requirements
- [ ] Challenge patterns properly logged
- [ ] Response timing consistent
- [ ] UI handles controversial content
- [ ] Scoring adapts to debate intensity

### Success Criteria
1. Sustained challenging dialogue throughout debate
2. All provocative responses properly logged
3. AI maintains Devil's Advocate personality
4. Summary reflects debate's argumentative nature
5. Scoring system handles contrarian style appropriately

### Notes
- Monitor for appropriate handling of sensitive content
- Document challenge patterns
- Track scoring variations
- Note any personality inconsistencies

## Test Plan 3: Philosophy Debate with Historical Helen

### Test Objective
Evaluate the system's ability to incorporate historical context and philosophical references while maintaining engaging debate flow and proper scoring of scholarly arguments.

### Test Subject
- Topic: "Life has an inherent, objective meaning" (PHIL004)
- AI Opponent: Historical Helen
- Expected Debate Style: Comparative, scholarly, historically-informed

### Test Steps

1. Game Initialization
   - Navigate to game setup screen
   - Select "Philosophy" category
   - Choose topic PHIL004
   - Select Historical Helen as opponent
   - Expected: Game loads with philosophical debate context

2. Initial Historical Context
   - Present modern existentialist perspective
   - Expected:
     - Helen responds with historical philosophical context
     - References to classical philosophers
     - Message logged with historical citations

3. Philosophical Evolution
   - Discuss changing views on meaning across eras
   - Expected:
     - Helen draws parallels from different time periods
     - Scholarly vocabulary maintained
     - Scoring reflects historical accuracy

4. Cross-Cultural Analysis
   - Present Eastern philosophical perspectives
   - Expected:
     - Helen compares Eastern and Western traditions
     - Response demonstrates comparative analysis
     - Scoring accounts for cultural context

5. Log Verification
   - Check debate_message.log
   - Verify entries for:
     - Historical references
     - Philosophical citations
     - Comparative analysis
     - Scholarly tone

6. Game Conclusion
   - End the debate
   - Expected:
     - Summary includes historical context
     - Scoring reflects scholarly depth
     - Complete philosophical timeline visible
     - All references properly logged

### Verification Points

#### Scoring System
- [ ] Each message scored based on:
  - Historical accuracy
  - Philosophical depth
  - Reference quality
  - Argument coherence

#### AI Personality
- [ ] Helen maintains scholarly traits:
  - Historical references
  - Scholarly vocabulary
  - Comparative examples
  - Authoritative tone

#### Technical Requirements
- [ ] Historical references properly logged
- [ ] Response timing appropriate
- [ ] UI displays complex philosophical content
- [ ] Scoring reflects scholarly depth

### Success Criteria
1. Consistent historical context throughout debate
2. All philosophical references properly logged
3. AI maintains Historical Helen's scholarly personality
4. Summary captures historical progression of argument
5. Scoring system properly weights historical context

### Notes
- Track historical accuracy of references
- Document philosophical connections
- Monitor scholarly language consistency
- Note any anachronisms or historical inaccuracies
