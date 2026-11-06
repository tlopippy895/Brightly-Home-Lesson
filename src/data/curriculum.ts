import { LessonTopic } from '../types';

export const NATIONAL_CURRICULUM_LESSONS: LessonTopic[] = [
  // ==========================================
  // PRIMARY 4 - TERM 1
  // ==========================================
  {
    id: 'p4-t1-w3-geo',
    grade: 4,
    term: 1,
    week: 3,
    subject: 'Social Studies',
    topic: 'Nigerian Geography: Regions, Climates & Major Cities',
    subtopic: 'The 6 Geopolitical Zones and Vegetation Belts',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 3 · Physical Geography & Regional Zones',
    isFree: false,
    teacherId: 'ibrahim',
    status: 'IN_PROGRESS',
    objectives: [
      'Identify the six geopolitical zones of Nigeria on a map',
      'Name major rivers (River Niger & River Benue) and where they meet (Lokoja confluence)',
      'Describe the two main seasons in Nigeria: Rainy (Wet) and Dry (Harmattan) seasons',
      'Locate key commercial and administrative cities: Abuja (FCT), Lagos, Kano, Port Harcourt, Enugu, and Ibadan'
    ],
    lastWeekRevision: 'Last week we studied the physical features of our local government area, including hills, valleys, and local water streams.',
    previousKnowledge: 'Pupils already know Nigeria has 36 states plus the Federal Capital Territory (Abuja) and have observed rainy and dry weather in their hometowns.',
    concreteVisualAids: [
      {
        title: 'Geopolitical Map of Nigeria',
        description: 'Map showing North-Central, North-East, North-West, South-East, South-South, and South-West zones.',
        itemType: 'nigerian_map',
        icon: '🗺️',
        caption: 'Nigeria with 6 Zones & 36 States'
      },
      {
        title: 'The Y-Shaped River Confluence at Lokoja',
        description: 'Where River Niger from Guinea highlands joins River Benue from Cameroon mountains to form the Y-shape.',
        itemType: 'shapes_chart',
        icon: '🌊',
        caption: 'Lokoja River Confluence'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. The 6 Geopolitical Zones of Nigeria',
        teacherSpeech: 'Look at our country’s map. To govern and organize effectively, Nigeria is grouped into six geopolitical zones: North-West, North-East, North-Central, South-West, South-East, and South-South.',
        boardText: 'NIGERIA’S 6 GEOPOLITICAL ZONES\n\n1. North-West (e.g. Kano, Kaduna, Sokoto)\n2. North-East (e.g. Borno, Bauchi, Adamawa)\n3. North-Central / Middle Belt (e.g. Plateau, Benue, Niger, FCT Abuja)\n4. South-West (e.g. Lagos, Oyo, Ogun, Ondo)\n5. South-East (e.g. Enugu, Anambra, Imo, Abia)\n6. South-South / Niger Delta (e.g. Rivers, Delta, Akwa Ibom)',
        bulletPoints: [
          '36 States + 1 Federal Capital Territory (Abuja)',
          'Abuja is in North-Central and is the administrative capital',
          'Lagos is in South-West and is the commercial nerve center'
        ],
        equationOrHighlight: 'Total States = 36 | Capital = Abuja (FCT)',
        diagramSvgType: 'map'
      },
      {
        stepNumber: 2,
        title: '2. Major Rivers: Niger and Benue',
        teacherSpeech: 'Two great rivers flow through Nigeria like arteries in the human body: River Niger (the longest) and River Benue. They meet at a historic junction called Lokoja in Kogi State. This meeting point forms a giant letter "Y" on the map!',
        boardText: 'THE GREAT RIVERS & CONFLUENCE\n\n• River Niger: Enters from the North-West\n• River Benue: Enters from Cameroon in the East\n• Confluence City: LOKOJA (Kogi State)\n• Flows South into: Atlantic Ocean through the Niger Delta Mangroves',
        bulletPoints: [
          'Confluence = Meeting point of two rivers',
          'Kogi State is nicknamed "The Confluence State"',
          'Provides fresh fish, fertile farmland, and water transportation'
        ],
        equationOrHighlight: 'River Niger + River Benue = Lokoja Confluence (Y-Shape)',
        diagramSvgType: 'confluence'
      },
      {
        stepNumber: 3,
        title: '3. Climate and Two Main Seasons in Nigeria',
        teacherSpeech: 'Unlike Europe where they have four seasons with winter snow, Nigeria experiences a tropical climate with two distinct seasons: The Rainy (Wet) Season and the Dry Season, which brings the cool, dusty Harmattan wind from the Sahara Desert.',
        boardText: 'OUR TWO SEASONS IN NIGERIA\n\n🌧️ RAINY SEASON (April – October):\n• Heavy rainfall, lush green vegetation\n• Farmers plant yams, maize, cassava\n\n☀️ DRY SEASON (November – March):\n• High sunshine and warm days\n• Harmattan wind (cool, dry, dusty breeze from the North)',
        bulletPoints: [
          'Southern coastal areas receive more rainfall',
          'Northern savanna areas have longer dry seasons and sunny days',
          'Harmattan brings dry skin and morning mist'
        ],
        equationOrHighlight: 'Rainy Season (April–Oct) ↔ Dry / Harmattan (Nov–March)',
        diagramSvgType: 'weather'
      }
    ],
    practiceProblems: [
      {
        id: 'p4-geo-1',
        question: 'At which Nigerian city do River Niger and River Benue meet to form a famous confluence?',
        concreteContext: 'Think of the state with the slogan "The Confluence State".',
        options: ['Lagos', 'Lokoja', 'Kano', 'Enugu'],
        correctIndex: 1,
        explanation: 'River Niger and River Benue meet at Lokoja in Kogi State.',
        visualAidIcon: '🌊'
      },
      {
        id: 'p4-geo-2',
        question: 'Which geopolitical zone is home to the Federal Capital Territory (Abuja)?',
        concreteContext: 'Abuja is located right near the center of Nigeria.',
        options: ['South-South', 'North-East', 'North-Central', 'South-West'],
        correctIndex: 2,
        explanation: 'Abuja is located in the North-Central geopolitical zone (also known as the Middle Belt).',
        visualAidIcon: '🏛️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p4-geo-q1',
        question: 'Which of the following states is correctly matched with its geopolitical zone?',
        contextNigerian: 'Consider the regional grouping of Nigerian states.',
        options: ['Kano - South-East', 'Rivers - South-South', 'Lagos - North-Central', 'Enugu - North-West'],
        correctAnswerIndex: 1,
        explanation: 'Rivers State (Port Harcourt) is in the South-South (Niger Delta) zone.',
        hint: 'Rivers State is in the coastal oil-rich delta region of southern Nigeria.'
      },
      {
        id: 'p4-geo-q2',
        question: 'During which period of the year does Nigeria typically experience the dry Harmattan season?',
        contextNigerian: 'Think about when dust from the Sahara and cool mornings occur around Christmas.',
        options: ['June to August', 'November to March', 'April to July', 'September only'],
        correctAnswerIndex: 1,
        explanation: 'The dry season and Harmattan wind blow between November and March.',
        hint: 'It occurs during the dry months when skies are hazy and morning air is brisk.'
      },
      {
        id: 'p4-geo-q3',
        question: 'What letter does the confluence of River Niger and River Benue resemble on the map of Nigeria?',
        contextNigerian: 'Look closely at how the two rivers flow from northwest and east down to the Atlantic.',
        options: ['Letter X', 'Letter T', 'Letter Y', 'Letter V'],
        correctAnswerIndex: 2,
        explanation: 'The two rivers meet at Lokoja and flow south together, forming the shape of a giant "Y".',
        hint: 'It has two branches at the top merging into one stem below.'
      },
      {
        id: 'p4-geo-q4',
        question: 'Which city serves as the Federal Capital Territory (FCT) of Nigeria, located in the North-Central zone?',
        contextNigerian: 'Remember where the seat of the Nigerian federal government is situated.',
        options: ['Lagos', 'Kano', 'Abuja', 'Enugu'],
        correctAnswerIndex: 2,
        explanation: 'Abuja is the Federal Capital Territory (FCT) of Nigeria, located in the North-Central geopolitical zone.',
        hint: 'It was created to be near the geographic center of the country.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 4 - MATHEMATICS (Week 1 - Free Lesson)
  // ==========================================
  {
    id: 'p4-t1-w1-math',
    grade: 4,
    term: 1,
    week: 1,
    subject: 'Mathematics',
    topic: 'Whole Numbers & Place Value up to 100,000',
    subtopic: 'Writing in Figures, Words & Expanded Notation',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Number & Numeration (Foundation Free Preview)',
    isFree: true, // 100% Free Week 1
    teacherId: 'chidinma',
    status: 'COMPLETED',
    userScore: 95,
    objectives: [
      'Count and write whole numbers up to 100,000 in figures and words',
      'Identify the place value of any digit (Units, Tens, Hundreds, Thousands, Ten Thousands)',
      'Expand numbers using place value decomposition (e.g. 48,250 = 40,000 + 8,000 + 200 + 50)',
      'Solve real-world Nigerian money word problems involving Naira counting'
    ],
    lastWeekRevision: 'In Primary 3, we mastered counting and place value up to 10,000 with cowries and base-10 blocks.',
    previousKnowledge: 'Pupils know that 10 tens make 100, and 10 hundreds make 1,000, and can count ₦1000 notes.',
    concreteVisualAids: [
      {
        title: 'Naira Currency Bundle Chart',
        description: 'Bundles of ₦1,000, ₦500, and ₦100 notes demonstrating place value.',
        itemType: 'naira_notes',
        icon: '💵',
        caption: '10 x ₦1,000 = ₦10,000 (Ten Thousand)'
      },
      {
        title: 'Place Value Abacus Chart',
        description: '5-spike abacus with beads for Units (U), Tens (T), Hundreds (H), Thousands (Th), and Ten Thousands (T.Th).',
        itemType: 'shapes_chart',
        icon: '🧮',
        caption: 'Place Value Columns: T.Th | Th | H | T | U'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Understanding Place Value Columns',
        teacherSpeech: 'Look at the number 54,321. Every digit has a house where it lives. From right to left: Units (1), Tens (10), Hundreds (100), Thousands (1,000), and Ten Thousands (10,000).',
        boardText: 'PLACE VALUE CHART:\n\n[Ten Thousands] [Thousands] [Hundreds] [Tens] [Units]\n       5              4          3        2       1\n\n• 5 Ten Thousands = 50,000\n• 4 Thousands     =  4,000\n• 3 Hundreds      =    300\n• 2 Tens          =     20\n• 1 Unit          =      1\nTotal = Fifty-four thousand, three hundred and twenty-one.',
        bulletPoints: [
          'Always read digits in groups of three from right with a comma',
          '54,321 has 5 Ten Thousands and 4 Thousands',
          'Value of digit 4 is 4,000'
        ],
        equationOrHighlight: '54,321 = 50,000 + 4,000 + 300 + 20 + 1',
        diagramSvgType: 'abacus'
      },
      {
        stepNumber: 2,
        title: '2. Expanded Form with Nigerian Market Examples',
        teacherSpeech: 'Imagine Mama Chidi sold 73,450 Naira worth of yams at Mile 12 Market. Let us break down this money: 70,000 + 3,000 + 400 + 50 + 0.',
        boardText: 'EXPANDED NOTATION:\n\n₦73,450 =\n7 Ten Thousands  (₦70,000)\n+ 3 Thousands    (₦3,000)\n+ 4 Hundreds     (₦400)\n+ 5 Tens         (₦50)\n+ 0 Units        (₦0)\n\nWord Form: Seventy-three thousand, four hundred and fifty Naira.',
        bulletPoints: [
          'Zero in units column means no single Naira coins',
          'Expanded form shows the true worth of each digit',
          'In words, use hyphen for two-word numbers (seventy-three)'
        ],
        equationOrHighlight: '₦73,450 = ₦70,000 + ₦3,000 + ₦400 + ₦50',
        diagramSvgType: 'money'
      }
    ],
    practiceProblems: [
      {
        id: 'p4-math-1',
        question: 'What is the place value of the digit 7 in the number 87,412?',
        concreteContext: 'Look at which column 7 sits in: T.Th, Th, H, T, or U.',
        options: ['Tens', 'Hundreds', 'Thousands', 'Ten Thousands'],
        correctIndex: 2,
        explanation: 'In 87,412, the digit 7 is in the Thousands column (worth 7,000).',
        visualAidIcon: '🧮'
      },
      {
        id: 'p4-math-2',
        question: 'How do you write Sixty-five thousand and twenty in figures?',
        concreteContext: 'Remember to place a zero in the Hundreds column!',
        options: ['65,200', '65,020', '6,520', '650,020'],
        correctIndex: 1,
        explanation: 'Sixty-five thousand and twenty is written as 65,020.',
        visualAidIcon: '📝'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p4-m-q1',
        question: 'In the number 94,832, what is the value of the digit 9?',
        contextNigerian: 'Look at the highest column on the abacus.',
        options: ['900', '9,000', '90,000', '900,000'],
        correctAnswerIndex: 2,
        explanation: 'Digit 9 sits in the Ten Thousands column, so its value is 90,000.',
        hint: 'It is 9 times 10,000.'
      },
      {
        id: 'p4-m-q2',
        question: 'What is the expanded form of 42,608?',
        contextNigerian: 'Notice there is a 0 in the Tens column.',
        options: [
          '40,000 + 2,000 + 600 + 80',
          '40,000 + 2,000 + 600 + 8',
          '4,000 + 200 + 60 + 8',
          '400,000 + 20,000 + 600 + 8'
        ],
        correctAnswerIndex: 1,
        explanation: '42,608 = 40,000 + 2,000 + 600 + 0 + 8 = 40,000 + 2,000 + 600 + 8.',
        hint: 'Break each digit into its place value.'
      },
      {
        id: 'p4-m-q3',
        question: 'How is the number 75,040 correctly written in words?',
        contextNigerian: 'Look at each place value group carefully.',
        options: [
          'Seventy-five thousand and four',
          'Seventy-five thousand and forty',
          'Seven thousand five hundred and forty',
          'Seven hundred and fifty thousand and forty'
        ],
        correctAnswerIndex: 1,
        explanation: '75 in the thousands group is seventy-five thousand, and 40 in tens is forty: Seventy-five thousand and forty.',
        hint: 'Notice the zero in the hundreds column.'
      },
      {
        id: 'p4-m-q4',
        question: 'A trader at Bodija market in Ibadan sold ₦50,000 worth of yams and ₦8,000 worth of plantains. How much money did she make in total?',
        contextNigerian: 'Add the two amounts using place value columns.',
        options: ['₦50,800', '₦58,000', '₦580,000', '₦85,000'],
        correctAnswerIndex: 1,
        explanation: '₦50,000 + ₦8,000 = ₦58,000 (Fifty-eight thousand Naira).',
        hint: 'Add 5 Ten Thousands and 8 Thousands.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 4 - MATHEMATICS (Week 2 - Fractions with Agege Bread)
  // ==========================================
  {
    id: 'p4-t1-w2-math',
    grade: 4,
    term: 1,
    week: 2,
    subject: 'Mathematics',
    topic: 'Fractions: Proper, Improper & Mixed Numbers',
    subtopic: 'Concrete Visual Slices (Agege Bread & Oranges)',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 2 · Fractions & Rational Numbers',
    isFree: false,
    teacherId: 'chidinma',
    status: 'COMPLETED',
    userScore: 90,
    reexplained: true,
    objectives: [
      'Identify the numerator (parts taken) and denominator (total equal parts)',
      'Differentiate between Proper Fractions (3/4), Improper Fractions (5/3), and Mixed Numbers (1 2/3)',
      'Convert improper fractions to mixed numbers using real-life food sharing',
      'Compare like and unlike fractions visually'
    ],
    lastWeekRevision: 'Last week we practiced whole numbers up to 100,000.',
    previousKnowledge: 'Pupils know that sharing a whole orange into 2 equal halves gives 1/2 each, and 4 quarters gives 1/4 each.',
    concreteVisualAids: [
      {
        title: 'Loaf of Fresh Agege Bread',
        description: 'A whole loaf sliced into 4 equal slices. 3 slices taken = 3/4.',
        itemType: 'agege_bread',
        icon: '🍞',
        caption: '1 Whole Loaf = 4 Equal Slices (4/4)'
      },
      {
        title: 'Sweet Nigerian Oranges',
        description: 'Juicy oranges cut into 8 equal segments for sharing among siblings.',
        itemType: 'oranges',
        icon: '🍊',
        caption: 'Fraction = Part / Whole'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is a Fraction?',
        teacherSpeech: 'Nno nwam! When you buy a warm loaf of Agege bread from the bakery and slice it into 4 equal pieces, each piece is 1 part out of 4, written as 1/4.',
        boardText: 'ANATOMY OF A FRACTION:\n\n   3  ← NUMERATOR (How many slices we have)\n  --- \n   4  ← DENOMINATOR (Total equal slices in 1 whole loaf)\n\n• Top Number (Numerator) = Parts taken\n• Bottom Number (Denominator) = Total equal parts',
        bulletPoints: [
          'Denominator CANNOT be zero',
          'Equal parts is mandatory (if slices are uneven, it is not a true fraction!)',
          '4/4 = 1 whole loaf'
        ],
        equationOrHighlight: 'Fraction = Numerator / Denominator',
        diagramSvgType: 'bread_fraction'
      },
      {
        stepNumber: 2,
        title: '2. The Three Types of Fractions',
        teacherSpeech: 'There are 3 main types: Proper Fractions (small top), Improper Fractions (big heavy top), and Mixed Numbers (a whole number standing next to a fraction).',
        boardText: 'TYPES OF FRACTIONS:\n\n1. PROPER FRACTION: Numerator < Denominator\n   Example: 2/5, 3/4, 7/10 (Less than 1 whole)\n\n2. IMPROPER FRACTION: Numerator ≥ Denominator\n   Example: 5/3, 9/4 (Greater than 1 whole)\n\n3. MIXED NUMBER: Whole Number + Proper Fraction\n   Example: 1 2/3 (1 whole loaf + 2 extra slices)',
        bulletPoints: [
          '5/3 means you have 5 slices, but 1 whole only takes 3 slices',
          'So 5/3 is the exact same as 1 whole loaf and 2/3 of another loaf (1 2/3)'
        ],
        equationOrHighlight: '5/3 = 1 whole + 2/3 = 1 2/3',
        diagramSvgType: 'improper_diagram'
      }
    ],
    practiceProblems: [
      {
        id: 'p4-frac-1',
        question: 'Which of the following is an IMPROPER fraction?',
        concreteContext: 'Look for the fraction where the top number (numerator) is bigger than the bottom.',
        options: ['2/3', '7/8', '9/5', '1/6'],
        correctIndex: 2,
        explanation: '9/5 has a numerator (9) larger than denominator (5), making it an improper fraction.',
        visualAidIcon: '🍞'
      },
      {
        id: 'p4-frac-2',
        question: 'Convert 7/3 into a mixed number.',
        concreteContext: 'How many groups of 3 can you make out of 7? What is the remainder?',
        options: ['1 1/3', '2 1/3', '2 2/3', '3 1/3'],
        correctIndex: 1,
        explanation: '7 ÷ 3 = 2 with a remainder of 1. So 7/3 = 2 1/3.',
        visualAidIcon: '🍊'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p4-f-q1',
        question: 'In a basket of 10 mangoes, Tunde ate 3 mangoes. What fraction of the mangoes did Tunde eat?',
        contextNigerian: 'Count the parts taken over the total mangoes in the basket.',
        options: ['3/10', '7/10', '10/3', '3/7'],
        correctAnswerIndex: 0,
        explanation: 'Tunde took 3 mangoes out of 10 total, which is 3/10.',
        hint: 'Numerator is 3, Denominator is 10.'
      },
      {
        id: 'p4-f-q2',
        question: 'Which fraction is equivalent to 1/2?',
        contextNigerian: 'Think of cutting an orange into 4 pieces and taking 2 pieces.',
        options: ['2/4', '1/4', '3/8', '2/6'],
        correctAnswerIndex: 0,
        explanation: '2/4 reduces to 1/2 by dividing both top and bottom by 2.',
        hint: '2 slices out of 4 is half the loaf.'
      },
      {
        id: 'p4-f-q3',
        question: 'Which of the following is an IMPROPER fraction?',
        contextNigerian: 'Look for a top-heavy fraction where the numerator is greater than the denominator.',
        options: ['3/4', '2/5', '7/4', '1/6'],
        correctAnswerIndex: 2,
        explanation: 'In 7/4, the numerator (7) is greater than the denominator (4), making it an improper fraction.',
        hint: 'The top number is larger than the bottom number.'
      },
      {
        id: 'p4-f-q4',
        question: 'If you have 7 slices of Agege bread and 4 slices make 1 whole loaf, what is 7/4 written as a mixed number?',
        contextNigerian: 'Count how many full loaves you can make and what fraction remains.',
        options: ['1 1/4', '1 3/4', '2 1/4', '2 3/4'],
        correctAnswerIndex: 1,
        explanation: '7 slices ÷ 4 slices per loaf = 1 whole loaf with 3 slices left over, which is 1 3/4 loaves.',
        hint: '4 slices make 1 whole loaf, leaving 3 slices out of 4.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 3 - BASIC SCIENCE (Week 3 - Mastered)
  // ==========================================
  {
    id: 'p3-t1-w3-sci',
    grade: 3,
    term: 1,
    week: 3,
    subject: 'Basic Science & Technology',
    topic: 'Living & Non-Living Things in Our Environment',
    subtopic: 'Characteristics of Living Organisms (MR NIGER D)',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 3 · Environmental Science & Living Things',
    isFree: false,
    teacherId: 'emeka',
    status: 'COMPLETED',
    userScore: 95,
    objectives: [
      'Distinguish between living and non-living things around the school and home compound',
      'Recite the 7 fundamental characteristics of living things using the mnemonic MR NIGER D',
      'Classify local examples: Goat, Neem tree, Cassava vs. Stone, Plastic bucket, Car',
      'Explain why plants are living things even though they do not walk around'
    ],
    lastWeekRevision: 'Last week we explored our school compound and drew a map of living plants and classroom furniture.',
    previousKnowledge: 'Pupils know that a puppy barks and grows, while a toy car cannot eat or grow on its own.',
    concreteVisualAids: [
      {
        title: 'Nigerian Yard Organisms',
        description: 'Living goat, mango tree, lizard alongside non-living clay pot and granite stones.',
        itemType: 'mangoes',
        icon: '🌿',
        caption: 'Living (Grows & Reproduces) vs. Non-Living'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What Makes Something Alive?',
        teacherSpeech: 'Good day! When you step into your compound in Enugu or Ibadan, you see goats, lizards, hibiscus flowers, and stones. How do we know which ones are alive? We use the golden Nigerian science code: MR NIGER D!',
        boardText: 'MR NIGER D - CHARACTERISTICS OF LIVING THINGS:\n\n• M - Movement (Animals walk/run, plants bend towards sunlight)\n• R - Respiration (Breathing in oxygen to release energy)\n• N - Nutrition (Eating food: plants make food via sunlight)\n• I - Irritability / Sensitivity (Reacting to touch, heat, cold)\n• G - Growth (Getting bigger and taller over time)\n• E - Excretion (Passing out waste materials)\n• R - Reproduction (Having babies/seeds to make more of its kind)\n• D - Death (All living things eventually die)',
        bulletPoints: [
          'Non-living things (like chairs, radios, rocks) cannot perform these functions',
          'Plants are living because they grow, make food, breathe, and reproduce from seeds'
        ],
        equationOrHighlight: 'Living Code = M.R.  N.I.G.E.R.  D.',
        diagramSvgType: 'mr_niger_d'
      },
      {
        stepNumber: 2,
        title: '2. Why Plants Are Living Organisms',
        teacherSpeech: 'Some pupils ask: "Mr Emeka, a mango tree cannot run or walk to the market, so how is it alive?" Plants do not need to walk to find food! They drink water from the soil, make their own food with sunlight, breathe through their leaves, and grow from tiny seeds into huge trees.',
        boardText: 'WHY PLANTS ARE LIVING ORGANISMS:\n\n1. Nutrition: Plants take water from the soil and make food from sunlight\n2. Respiration: Plants breathe in gases through tiny leaf pores\n3. Growth: A tiny maize seed grows into a tall plant with corn cobs\n4. Reproduction: Plants produce seeds and flowers to create new plants',
        bulletPoints: [
          'Plants move by bending towards the sunlight',
          'A wooden desk was once wood from a tree, but is now non-living'
        ],
        equationOrHighlight: 'Plants Breathe + Feed + Grow + Reproduce = LIVING ORGANISMS!',
        diagramSvgType: 'plant_growth'
      }
    ],
    practiceProblems: [
      {
        id: 'p3-sci-1',
        question: 'Which of the following is a LIVING thing?',
        concreteContext: 'Which one can breathe, eat, and grow?',
        options: ['Wooden desk', 'Mango tree', 'Metal bell', 'Blackboard'],
        correctIndex: 1,
        explanation: 'A mango tree grows from a seed, produces fruits, and is a living organism.',
        visualAidIcon: '🌳'
      },
      {
        id: 'p3-sci-2',
        question: 'Which of the following is a NON-LIVING object in our school compound?',
        concreteContext: 'Look for the item that cannot breathe, eat, or grow.',
        options: ['Wall gecko', 'Granite stone', 'Neem tree', 'Grasshopper'],
        correctIndex: 1,
        explanation: 'A granite stone cannot breathe, eat food, or grow, so it is non-living.',
        visualAidIcon: '🪨'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p3-s-q1',
        question: 'Which of the following items found around your home compound is a LIVING thing?',
        contextNigerian: 'Remember the characteristics of living organisms.',
        options: ['Plastic bucket', 'Nigerian domestic goat', 'Clay cooking pot', 'Iron gate'],
        correctAnswerIndex: 1,
        explanation: 'A Nigerian goat is a living organism because it eats grass, breathes air, and gives birth to kids.',
        hint: 'It can run around, bleat, and eat food.'
      },
      {
        id: 'p3-s-q2',
        question: 'What does the letter "R" stand for in the MR NIGER D mnemonic for living things?',
        contextNigerian: 'Think of breathing in air and producing offspring.',
        options: ['Running and Resting', 'Respiration and Reproduction', 'Reading and Writing', 'Rushing and Rising'],
        correctAnswerIndex: 1,
        explanation: 'The two Rs stand for Respiration (breathing) and Reproduction (producing young ones).',
        hint: 'One is breathing, the other is making babies or seeds.'
      },
      {
        id: 'p3-s-q3',
        question: 'A pupil planted a cassava stem in the garden and placed a granite stone next to it. After two months, what will happen?',
        contextNigerian: 'Think about which one can grow new parts.',
        options: [
          'Both the stone and cassava will grow taller',
          'The stone will make babies and the cassava will not',
          'The cassava will grow leaves and roots, while the stone remains unchanged',
          'The stone will walk away'
        ],
        correctAnswerIndex: 2,
        explanation: 'Cassava is living so it grows leaves and roots. The stone is non-living so it remains unchanged.',
        hint: 'Living things grow; non-living things stay the same.'
      },
      {
        id: 'p3-s-q4',
        question: 'Why is a neem tree or mango tree classified as a living thing even though it does not walk down the street?',
        contextNigerian: 'Think of how plants feed, breathe, and reproduce from seeds.',
        options: [
          'Because people climb it',
          'Because it breathes, makes food from sunlight, and grows from seeds',
          'Because it is painted green',
          'Because it has wooden branches'
        ],
        correctAnswerIndex: 1,
        explanation: 'Plants are living things because they make food through sunlight, breathe through leaves, and reproduce via seeds.',
        hint: 'They perform the functions in MR NIGER D.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 4 - ENGLISH STUDIES (Week 2 - Re-explained Module)
  // ==========================================
  {
    id: 'p4-t1-w2-eng',
    grade: 4,
    term: 1,
    week: 2,
    subject: 'English Studies',
    topic: 'Nouns: Proper, Common, Collective & Abstract',
    subtopic: 'Identifying Naming Words in Nigerian Contexts',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 2 · Grammatical Nouns & Classification',
    isFree: false,
    teacherId: 'zainab',
    status: 'COMPLETED',
    userScore: 90,
    reexplained: true,
    objectives: [
      'Define a noun as a naming word for a person, animal, place, or thing',
      'Identify proper nouns (capital letter: Abuja, Lagos, Kano, Aminat, Nigeria)',
      'Distinguish between Proper Nouns and Common Nouns (country, girl, city)',
      'Recognize Collective Nouns (a herd of cattle, a flock of birds, a pride of lions)',
      'Understand Abstract Nouns (honesty, happiness, courage - things you cannot touch)'
    ],
    lastWeekRevision: 'Last week we revised parts of speech and phonics sounds.',
    previousKnowledge: 'Pupils know their own names and names of objects in their classroom like pencil, desk, bag.',
    concreteVisualAids: [
      {
        title: 'Naming Word Basket',
        description: 'Categorizing words into People (Doctor, Aminat), Places (Abuja, Lagos, Kano), and Things (Book, Drum).',
        itemType: 'shapes_chart',
        icon: '📚',
        caption: 'Person | Place | Animal | Thing | Idea'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. The Four Types of Nouns & Proper Nouns',
        teacherSpeech: 'Sannu kowa, good day! A noun is simply the name of anything. Today our special focus is on identifying Proper Nouns! A Proper Noun is the special name of a particular person, place, or day. For example: Abuja, Lagos, Kano, Aminat, and Nigeria. Every Proper Noun ALWAYS begins with a Capital Letter, wherever it appears in a sentence!',
        boardText: 'FOUR TYPES OF NOUNS:\n\n1. PROPER NOUN: Specific name, ALWAYS starts with Capital Letter!\n   • Places: Abuja (Federal Capital), Lagos (Commercial hub), Kano (Ancient city)\n   • People: Aminat, Chidi, Emeka, Musa\n   • Days & Months: Monday, Friday, October\n\n2. COMMON NOUN: General name of persons, places, or things.\n   • boy, teacher, hospital, city, yam\n\n3. COLLECTIVE NOUN: Name for a group of things or people.\n   • A herd of cattle (Fulani herdsmen)\n   • A swarm of bees\n   • A bouquet of flowers\n\n4. ABSTRACT NOUN: Quality, feeling, or state you cannot physically touch.\n   • Kindness, bravery, honesty, wisdom',
        bulletPoints: [
          'Always capitalize Proper Nouns wherever they appear in a sentence',
          'Abstract nouns represent feelings and ideas (e.g. Joy, Peace)'
        ],
        equationOrHighlight: 'Proper (Capital) vs Common (General) vs Collective (Group) vs Abstract (Feeling)',
        diagramSvgType: 'nouns_tree'
      },
      {
        stepNumber: 2,
        title: '2. Collective and Abstract Nouns in Nigeria',
        teacherSpeech: 'When we name a group of people, animals, or things together, we use a Collective Noun (like a herd of cattle moving across the savanna). When we name qualities, feelings, or virtues that you cannot hold in your hand, we call them Abstract Nouns (like honesty, joy, or courage).',
        boardText: 'COLLECTIVE & ABSTRACT NOUNS:\n\n3. COLLECTIVE NOUN: Name for a group as one whole.\n   • A herd of cattle (grazing in the meadow)\n   • A swarm of bees\n   • A flock of birds\n   • A team of football players (Super Eagles)\n\n4. ABSTRACT NOUN: An idea, feeling, or quality you cannot physically touch.\n   • Honesty, bravery, wisdom, love, joy, truth',
        bulletPoints: [
          'Collective nouns treat the group as a single unit',
          'Abstract nouns represent feelings and moral qualities'
        ],
        equationOrHighlight: 'Collective (Group: herd of cattle) | Abstract (Quality: honesty & bravery)',
        diagramSvgType: 'nouns_groups'
      }
    ],
    practiceProblems: [
      {
        id: 'p4-eng-1',
        question: 'Which word in this sentence is a PROPER noun? "Aminat travelled to Kano on Monday."',
        concreteContext: 'Look for specific names that must always start with a capital letter.',
        options: ['travelled', 'Aminat, Kano, Monday', 'to', 'on'],
        correctIndex: 1,
        explanation: 'Aminat (person), Kano (city), and Monday (day) are specific names and thus Proper Nouns.',
        visualAidIcon: '✍️'
      },
      {
        id: 'p4-eng-2',
        question: 'Which of the following is an ABSTRACT noun that you cannot touch with your hands?',
        concreteContext: 'Think of a character virtue or feeling.',
        options: ['Yam tuber', 'Wooden chair', 'Bravery', 'Pencil'],
        correctIndex: 2,
        explanation: 'Bravery is an internal quality and feeling, making it an Abstract Noun.',
        visualAidIcon: '💡'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p4-e-q1',
        question: 'A noun is best defined as which part of speech in English grammar?',
        contextNigerian: 'Remember the foundational definition of a noun.',
        options: [
          'An action or doing word',
          'A naming word for a person, animal, place, thing, or idea',
          'A word that describes how something is done',
          'A connecting word that joins two sentences'
        ],
        correctAnswerIndex: 1,
        explanation: 'A noun is a naming word used to identify persons, animals, places, things, and ideas.',
        hint: 'It gives names to everything in our world.'
      },
      {
        id: 'p4-e-q2',
        question: 'Which of the following sentences correctly identifies and capitalizes the PROPER nouns?',
        contextNigerian: 'Look closely at the capitalization of Nigerian cities: Abuja, Lagos, and Kano.',
        options: [
          'We travelled from abuja to lagos and kano.',
          'We travelled from Abuja to Lagos and Kano.',
          'We travelled from abuja to Lagos and Kano.',
          'We travelled from Abuja to lagos and kano.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Abuja, Lagos, and Kano are proper nouns (specific city names in Nigeria), so all three must begin with a capital letter.',
        hint: 'Specific city names (Abuja, Lagos, Kano) must always start with capital letters.'
      },
      {
        id: 'p4-e-q3',
        question: 'What is the correct collective noun for a group of cows grazing together in the field?',
        contextNigerian: 'Think of cattle moving together across the savanna.',
        options: ['A flock of cattle', 'A herd of cattle', 'A school of cattle', 'A pack of cattle'],
        correctAnswerIndex: 1,
        explanation: 'A group of cattle is called a "herd of cattle".',
        hint: 'Sheep have flocks; cattle have herds.'
      },
      {
        id: 'p4-e-q4',
        question: 'Which word in the following list is an ABSTRACT noun that represents a feeling or quality?',
        contextNigerian: 'Think of what you can feel in your heart but cannot pick up with your hands.',
        options: ['Blackboard', 'Happiness', 'Orange', 'Motorcycle'],
        correctAnswerIndex: 1,
        explanation: 'Happiness is an emotion and state of mind, so it is an Abstract Noun.',
        hint: 'You cannot hold it in your hand like an orange or blackboard.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 2 - MATHEMATICS (For Aminat's profile)
  // ==========================================
  {
    id: 'p2-t1-w3-math',
    grade: 2,
    term: 1,
    week: 3,
    subject: 'Mathematics',
    topic: 'Counting in 2s, 3s, 5s and 10s up to 100',
    subtopic: 'Skip Counting with Nigerian Coins & Cowries',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 3 · Skip Counting & Pattern Numeration',
    isFree: true,
    teacherId: 'chidinma',
    status: 'IN_PROGRESS',
    objectives: [
      'Skip count forwards and backwards in 2s, 5s, and 10s up to 100',
      'Use 5 Naira notes and 10 Naira notes to practice fast counting',
      'Identify even numbers (pairs) and odd numbers (leftover one)'
    ],
    lastWeekRevision: 'Counting single numbers 1 to 50 using counting sticks.',
    previousKnowledge: 'Pupils know how to count to 50 by ones.',
    concreteVisualAids: [
      {
        title: '100-Square Number Grid',
        description: 'Colorful chart highlighting skip counting steps.',
        itemType: 'shapes_chart',
        icon: '🔢',
        caption: 'Skip Count: 5, 10, 15, 20, 25, 30...'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Skip Counting in 5s and 10s',
        teacherSpeech: 'Nno nwam, good day! When you have a stack of ₦10 notes, you do not count 1, 2, 3... You count 10, 20, 30, 40, 50! This is skip counting.',
        boardText: 'SKIP COUNTING IN 10s:\n10, 20, 30, 40, 50, 60, 70, 80, 90, 100\n\nSKIP COUNTING IN 5s:\n5, 10, 15, 20, 25, 30, 35, 40, 45, 50',
        bulletPoints: [
          'All numbers ending in 0 or 5 belong to the 5s family',
          'Counting by 10s is fast for money calculation'
        ],
        equationOrHighlight: '5 → 10 → 15 → 20 → 25 → 30',
        diagramSvgType: 'grid'
      },
      {
        stepNumber: 2,
        title: '2. Skip Counting in 2s with Pairs of Shoes',
        teacherSpeech: 'Look down at your feet! You have 2 shoes: a left shoe and a right shoe. That is 1 pair. If 3 pupils stand in front of the class, we count their shoes in 2s: 2, 4, 6 shoes! Any number that pairs up without a leftover is an EVEN number.',
        boardText: 'COUNTING IN 2s (PAIRS):\n2, 4, 6, 8, 10, 12, 14, 16, 18, 20\n\n• EVEN NUMBERS: Can be split into pairs (2, 4, 6, 8, 10...)\n• ODD NUMBERS: Always have 1 leftover item (1, 3, 5, 7, 9...)',
        bulletPoints: [
          '2 shoes = 1 pair',
          '4 shoes = 2 pairs',
          '6 shoes = 3 pairs'
        ],
        equationOrHighlight: 'Count in 2s: 2 → 4 → 6 → 8 → 10 → 12',
        diagramSvgType: 'pairs_chart'
      }
    ],
    practiceProblems: [
      {
        id: 'p2-m-1',
        question: 'Fill in the missing number when counting in 10s: 10, 20, 30, ___, 50, 60',
        concreteContext: 'Counting in 10 Naira notes.',
        options: ['35', '40', '45', '70'],
        correctIndex: 1,
        explanation: 'Counting by 10s gives 10, 20, 30, 40, 50, 60.',
        visualAidIcon: '💵'
      },
      {
        id: 'p2-m-2',
        question: 'If you count 3 pairs of school shoes in 2s: 2, 4, ___! How many shoes are there in total?',
        concreteContext: 'Think of 3 pairs of shoes.',
        options: ['5 shoes', '6 shoes', '7 shoes', '8 shoes'],
        correctIndex: 1,
        explanation: 'Three pairs of shoes is 2, 4, 6 shoes in total.',
        visualAidIcon: '👟'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p2-m-q1',
        question: 'What is the next number after 25 when counting in 5s?',
        contextNigerian: 'Count on 5 more: 5, 10, 15, 20, 25, ___',
        options: ['26', '30', '35', '40'],
        correctAnswerIndex: 1,
        explanation: '25 + 5 = 30.',
        hint: 'Count on 5 more fingers.'
      },
      {
        id: 'p2-m-q2',
        question: 'Aminat has four ₦10 notes to buy snacks at break time. How much money does she have in total?',
        contextNigerian: 'Count in tens: 10, 20, 30, ___!',
        options: ['₦20', '₦30', '₦40', '₦50'],
        correctAnswerIndex: 2,
        explanation: 'Four ₦10 notes is 10, 20, 30, 40 Naira in total.',
        hint: 'Count 4 notes in tens.'
      },
      {
        id: 'p2-m-q3',
        question: 'Count in 2s to find the next number in this sequence: 2, 4, 6, 8, ___',
        contextNigerian: 'Add 2 more to 8.',
        options: ['9', '10', '11', '12'],
        correctAnswerIndex: 1,
        explanation: 'Counting in 2s: 2, 4, 6, 8, 10.',
        hint: 'It is an even number ending in 0.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: ENGLISH STUDIES
  // ==========================================
  {
    id: 'p1-t1-w1-engli',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'English Studies',
    topic: 'Pre-Reading Skills: Phonemic Awareness (Identifying Sounds)',
    subtopic: 'Letter-Sound Identification (/a/, /b/, /c/, /d/) & Sound Production',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Foundational Phonics & Letter Sounds',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Listen carefully and distinguish between different environmental and speech sounds',
      'Pronounce the basic letter sounds /a/ as in apple, /b/ as in ball, /c/ as in cup',
      'Identify objects in the classroom that begin with letter sounds /a/, /b/, /c/',
      'Segment simple two-sound words like "at", "an", and "in"'
    ],
    lastWeekRevision: 'Welcome to Primary 1! This is our very first week of learning how spoken words are built from tiny sounds.',
    previousKnowledge: 'Pupils can recognize common everyday spoken words and imitate animal or vehicle sounds playfully.',
    concreteVisualAids: [
      {
        title: 'Letter Sound Flashcards',
        description: 'Large colorful cards showing letters A, B, C with an apple, a ball, and a cup.',
        itemType: 'shapes_chart',
        icon: '🔤',
        caption: 'Phonics Sound Cards'
      },
      {
        title: 'Classroom Sound Box',
        description: 'A box of small toys: a bell, a ball, an orange, and a toy car to test sound identification.',
        itemType: 'general',
        icon: '📦',
        caption: 'Sound Discovery Box'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is a Letter Sound?',
        teacherSpeech: 'Sannu kowa! In Primary 1, we learn that letters have names and letters make special sounds. When we say the letter "A", its sound is /æ/ like in "Amina" or "Apple"!',
        boardText: 'LETTER SOUNDS (PHONEMIC AWARENESS)\n\n• Letter A says /æ/ → as in Apple 🍎, Ant 🐜\n• Letter B says /b/ → as in Ball ⚽, Book 📖\n• Letter C says /k/ → as in Cup ☕, Cat 🐱',
        bulletPoints: [
          'Every letter makes a sound with our mouth',
          'We use our listening ears to hear the beginning sound',
          'We say the sound clearly together!'
        ],
        equationOrHighlight: 'A = /æ/ | B = /b/ | C = /k/',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Clapping Out the Sounds',
        teacherSpeech: 'Let us clap whenever we hear the /b/ sound. Listen: "Ball!" (Clap!). "Banana!" (Clap!). "Book!" (Clap!). Excellent listening, champions!',
        boardText: 'LISTENING & BLENDING\n\n• /b/ + /æ/ + /t/ = BAT 🏏\n• /k/ + /æ/ + /t/ = CAT 🐱\n• /æ/ + /t/ = AT',
        bulletPoints: [
          'Listen to each individual sound',
          'Put the sounds together smoothly to make a word'
        ],
        equationOrHighlight: '/k/ + /æ/ + /t/ = CAT',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-eng-p1',
        question: 'Which word starts with the /b/ sound like "Ball"?',
        concreteContext: 'Say each word slowly and listen to your lips at the start.',
        options: ['Apple', 'Book', 'Cup', 'Sun'],
        correctIndex: 1,
        explanation: '"Book" starts with the /b/ sound, just like "Ball"!',
        visualAidIcon: '📖'
      },
      {
        id: 'p1-eng-p2',
        question: 'What sound does the letter "A" make in "Apple"?',
        concreteContext: 'Open your mouth wide like you are about to bite a sweet fruit.',
        options: ['/m/', '/t/', '/æ/', '/s/'],
        correctIndex: 2,
        explanation: 'Letter A makes the /æ/ sound in apple and ant.',
        visualAidIcon: '🍎'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-eng-q1',
        question: 'Which of these fruits starts with the /a/ sound?',
        contextNigerian: 'Look at the fruits in the market tray.',
        options: ['Banana', 'Apple', 'Mango', 'Orange'],
        correctAnswerIndex: 1,
        explanation: 'Apple begins with the /a/ sound: /æ/ - pple!',
        hint: 'It is a red or green round fruit that starts with A.'
      },
      {
        id: 'p1-eng-q2',
        question: 'Amina sees a Cup on the table. What sound does the word "Cup" begin with?',
        contextNigerian: 'Listen to the first sound: /k/ - up.',
        options: ['/k/', '/b/', '/d/', '/m/'],
        correctAnswerIndex: 0,
        explanation: '"Cup" begins with the /k/ sound made by the letter C.',
        hint: 'Make the sound at the back of your throat.'
      },
      {
        id: 'p1-eng-q3',
        question: 'Which word has the beginning sound /b/?',
        contextNigerian: 'What do children kick on the school field during break time?',
        options: ['Chair', 'Desk', 'Ball', 'Pencil'],
        correctAnswerIndex: 2,
        explanation: '"Ball" begins with the letter B and the sound /b/.',
        hint: 'It is round and bounces on the playground.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: MATHEMATICS
  // ==========================================
  {
    id: 'p1-t1-w1-mathe',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Mathematics',
    topic: 'Whole Numbers 1–5',
    subtopic: 'Counting, Identification, and Writing Numbers 1 to 5',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Counting Objects 1 to 5 & Number Recognition',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Count real concrete objects from 1 up to 5 accurately',
      'Recognize and name the numerals 1, 2, 3, 4, 5',
      'Match a group of objects with its correct numeral',
      'Trace and write numerals 1 to 5 with correct pencil strokes'
    ],
    lastWeekRevision: 'Welcome to Primary 1 Mathematics! We are learning to count things around us.',
    previousKnowledge: 'Children can show their fingers and know when they have one sweet or two sweets.',
    concreteVisualAids: [
      {
        title: 'Counting Oranges',
        description: 'Five fresh, ripe Nigerian oranges lined up on a wooden table.',
        itemType: 'oranges',
        icon: '🍊',
        caption: 'Counting 1, 2, 3, 4, 5 Oranges'
      },
      {
        title: 'Counting Fingers Hand Chart',
        description: 'A colorful chart showing 1 finger, 2 fingers, up to 5 fingers on one hand.',
        itemType: 'shapes_chart',
        icon: '🖐️',
        caption: 'One Hand = 5 Fingers'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Counting Objects 1 to 5',
        teacherSpeech: 'Look at the oranges on our table. Let us count them together one by one: 1 orange, 2 oranges, 3 oranges, 4 oranges, 5 oranges! On one hand, we have exactly five fingers!',
        boardText: 'COUNTING WHOLE NUMBERS 1 TO 5\n\n1 🍊 (One orange)\n2 🍊🍊 (Two oranges)\n3 🍊🍊🍊 (Three oranges)\n4 🍊🍊🍊🍊 (Four oranges)\n5 🍊🍊🍊🍊🍊 (Five oranges)',
        bulletPoints: [
          'Point to each object as you count',
          'Say the number loud and proud',
          'The last number you say is the total amount'
        ],
        equationOrHighlight: '1 • 2 • 3 • 4 • 5',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Writing the Numerals',
        teacherSpeech: 'Number 1 is like a straight standing stick: down we go and that is one! Number 2 is around and back on the railway track: two, two, two!',
        boardText: 'HOW TO WRITE 1 TO 5\n\n1 : One straight line down\n2 : Curve around and flat across the bottom\n3 : Around a tree, around a tree\n4 : Down and over, down once more\n5 : Short neck, belly fat, number 5 wears a hat!',
        bulletPoints: [
          'Practice tracing with your finger in the air',
          'Count the dots to check your answer'
        ],
        equationOrHighlight: '1, 2, 3, 4, 5',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-mat-p1',
        question: 'Count the stars: ⭐ ⭐ ⭐. How many stars are there?',
        concreteContext: 'Touch each star with your finger as you count.',
        options: ['1', '2', '3', '4'],
        correctIndex: 2,
        explanation: 'Counting: 1, 2, 3! There are 3 stars.',
        visualAidIcon: '⭐'
      },
      {
        id: 'p1-mat-p2',
        question: 'How many fingers are on one whole hand?',
        concreteContext: 'Hold up one hand and count your fingers.',
        options: ['3', '4', '5', '6'],
        correctIndex: 2,
        explanation: 'There are 5 fingers on one hand: thumb, index, middle, ring, and pinky!',
        visualAidIcon: '🖐️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-mat-q1',
        question: 'Chinedu has 4 ripe bananas in his bag. Which numeral shows 4?',
        contextNigerian: 'Look closely at the numbers.',
        options: ['2', '3', '4', '5'],
        correctAnswerIndex: 2,
        explanation: 'The numeral 4 represents four items.',
        hint: 'It is the number right after 3.'
      },
      {
        id: 'p1-mat-q2',
        question: 'Which group has exactly 2 objects?',
        contextNigerian: 'Count the items in each choice.',
        options: ['⚽', '⚽⚽', '⚽⚽⚽', '⚽⚽⚽⚽'],
        correctAnswerIndex: 1,
        explanation: '⚽⚽ has two balls.',
        hint: 'Look for a pair of footballs.'
      },
      {
        id: 'p1-mat-q3',
        question: 'What number comes immediately after 4 when counting forward?',
        contextNigerian: '1, 2, 3, 4, ___?',
        options: ['2', '3', '5', '6'],
        correctAnswerIndex: 2,
        explanation: 'Counting forward: 1, 2, 3, 4, 5. The number after 4 is 5.',
        hint: 'Count the fingers on one hand.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: BASIC SCIENCE
  // ==========================================
  {
    id: 'p1-t1-w1-basic',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Basic Science & Technology',
    topic: 'Exploring Our Environment (Part 1)',
    subtopic: 'Understanding what an environment is, identifying our surroundings, and using our senses',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · What is Our Environment? Exploring With Our Senses',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Define our environment as everything around us in our home, school, and community',
      'Name common things found in our immediate classroom and school surroundings',
      'Identify how we use our five senses (seeing, hearing, smelling, touching, tasting) to explore our surroundings safely',
      'Differentiate between natural things (trees, grass, sun) and man-made things (desks, pencils, blackboard)'
    ],
    lastWeekRevision: 'Welcome to your very first Basic Science lesson in Primary 1! Today we become young scientists who observe the world.',
    previousKnowledge: 'Pupils know their way to school and can recognize trees, classroom chairs, books, and playground sand.',
    concreteVisualAids: [
      {
        title: 'Classroom & School Compound Chart',
        description: 'Large colorful drawing showing school buildings, mango trees, the Nigerian national flag, and happy pupils at their desks.',
        itemType: 'shapes_chart',
        icon: '🏫',
        caption: 'Our School Environment'
      },
      {
        title: 'The Five Senses Discovery Wheel',
        description: 'Child-friendly wheel showing eyes for seeing, ears for hearing, nose for smelling, skin for touching, and tongue for tasting.',
        itemType: 'shapes_chart',
        icon: '👀',
        caption: 'We Explore with Our 5 Senses'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is an Environment?',
        teacherSpeech: 'Sannu my young scientists! An environment is everything that surrounds us. Wherever you are right now—look up at the ceiling, look down at the floor, look at your desk, look at your teacher—all of that is your environment! At home, your bedroom and compound are your home environment. In school, our compound and classrooms are our school environment.',
        boardText: 'WHAT IS OUR ENVIRONMENT?\n\n• Environment = Everything around us!\n• Examples in our Classroom:\n  - Wooden desks and chairs 🪑\n  - Blackboard and white chalk 🖍️\n  - Books and school bags 🎒\n  - Our teacher and school friends 🧑‍🤝‍🧑',
        bulletPoints: [
          'Our environment is everywhere we go',
          'We must keep our environment clean and tidy',
          'Things in our environment can be living or non-living'
        ],
        equationOrHighlight: 'Environment = Everything Around Us',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Exploring with Our Five Senses',
        teacherSpeech: 'How do we know what is in our environment? God gave us five wonderful senses! We use our EYES to see colors and shapes. We use our EARS to hear the teacher’s voice and the birds singing outside. We use our NOSE to smell flowers. We use our HANDS and skin to feel smooth paper or rough tree bark. But remember: we never taste unknown things in the classroom!',
        boardText: 'OUR 5 SENSES FOR EXPLORING\n\n1. 👀 Eyes → Seeing (trees, colors, books)\n2. 👂 Ears → Hearing (school bell, birds, songs)\n3. 👃 Nose → Smelling (fresh rain, flowers)\n4. ✋ Skin/Hands → Touching (smooth table, rough bark)\n5. 👅 Tongue → Tasting (sweet orange, warm pap)',
        bulletPoints: [
          'Always use your eyes and ears to explore first',
          'Touch gently without breaking things',
          'Never put strange objects into your mouth'
        ],
        equationOrHighlight: 'Eyes • Ears • Nose • Hands • Tongue',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-sci-p1',
        question: 'Which of our five senses do we use to see the green leaves on a mango tree?',
        concreteContext: 'Point to the part of your face that helps you see pictures.',
        options: ['Our Ears', 'Our Eyes', 'Our Nose', 'Our Tongue'],
        correctIndex: 1,
        explanation: 'We use our eyes to see colors, people, and things around us in our environment.',
        visualAidIcon: '👀'
      },
      {
        id: 'p1-sci-p2',
        question: 'Which of these is something we see inside our classroom environment?',
        concreteContext: 'Look at what you sit on during your lessons.',
        options: ['An Airplane', 'A Classroom Desk', 'A Big River', 'A Tractor'],
        correctIndex: 1,
        explanation: 'A classroom desk is part of our school and classroom environment.',
        visualAidIcon: '🪑'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-sci-q1',
        question: 'What is the meaning of "environment"?',
        contextNigerian: 'Remember what Mallama Zainab taught us today.',
        options: [
          'Only the toys in our room',
          'Everything around us in our home, school, and community',
          'Only big animals in the forest',
          'A type of delicious food'
        ],
        correctAnswerIndex: 1,
        explanation: 'Our environment means everything that surrounds us wherever we are.',
        hint: 'It includes everything you can see, hear, and touch around you.'
      },
      {
        id: 'p1-sci-q2',
        question: 'When the school bell rings for break time, which sense do you use to hear it?',
        contextNigerian: 'Ding! Dong! The bell is ringing!',
        options: ['Sense of Taste (Tongue)', 'Sense of Hearing (Ears)', 'Sense of Touch (Fingers)', 'Sense of Smell (Nose)'],
        correctAnswerIndex: 1,
        explanation: 'We use our ears to hear sounds like the school bell, singing, and speech.',
        hint: 'You have two of them on the sides of your head.'
      },
      {
        id: 'p1-sci-q3',
        question: 'Which of these things in our school environment was made by nature, not by a carpenter?',
        contextNigerian: 'Look outside in the school compound.',
        options: ['Wooden desk', 'Plastic ruler', 'Green mango tree', 'Blackboard'],
        correctAnswerIndex: 2,
        explanation: 'A green mango tree is a living plant from nature; desks and rulers are made by human beings.',
        hint: 'It grows from the ground and has fresh green leaves.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: PHYSICAL & HEALTH EDUCATION
  // ==========================================
  {
    id: 'p1-t1-w1-physi',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Physical and Health Education',
    topic: 'Motor Skills Development: Moving Our Body Parts 1',
    subtopic: 'Identifying and moving body parts: head, shoulders, arms, hands, legs, and feet',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Healthy Bodies & Joyful Movement',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Identify and name major body parts: head, shoulders, arms, hands, knees, legs, and feet',
      'Demonstrate how to move individual body parts safely (nodding head, waving hands, bending knees)',
      'Perform simple stretching movements to improve balance, posture, and coordination',
      'Participate actively in the traditional "Head, Shoulders, Knees and Toes" action song'
    ],
    lastWeekRevision: 'Welcome to your first Physical and Health Education lesson! Exercise keeps our hearts and muscles strong.',
    previousKnowledge: 'Pupils know how to run, jump, and point to their nose, eyes, and hands.',
    concreteVisualAids: [
      {
        title: 'Full Body Movement Chart',
        description: 'Large illustration of an active Nigerian school pupil demonstrating head, shoulder, arm, waist, leg, and foot movements.',
        itemType: 'shapes_chart',
        icon: '🏃🏾',
        caption: 'Our Active Body Parts'
      },
      {
        title: 'Action Posture Cards',
        description: 'Four cards showing: 1. Standing tall, 2. Raising arms to the sky, 3. Marching in place, 4. Touching toes.',
        itemType: 'shapes_chart',
        icon: '🧍🏾',
        caption: 'Stretch and Balance Postures'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Naming Our Body Parts',
        teacherSpeech: 'Good day active champions! Stand up straight and let us play "Teacher Says"! Teacher says: touch your head! Good! Teacher says: touch your two shoulders! Wonderful! Now wiggle your ten fingers in the air like stars! Our bodies have three main sections: head at the top, trunk in the middle, and limbs (arms and legs) that help us move.',
        boardText: 'OUR BODY PARTS\n\n• Top: Head, neck, eyes, ears 🗣️\n• Middle: Shoulders, chest, waist 👕\n• Limbs:\n  - Arms, elbows, hands, fingers (Upper Limbs) ✋\n  - Thighs, knees, legs, feet, toes (Lower Limbs) 🦵',
        bulletPoints: [
          'Every body part has a special job',
          'Hands help us write, eat, and clap',
          'Legs and feet help us walk, march, and jump'
        ],
        equationOrHighlight: 'Head • Shoulders • Knees • Toes',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Safe and Healthy Body Movements',
        teacherSpeech: 'Let us practice moving each part without bumping into our neighbors. Gently nod your head up and down: "Yes, yes, yes". Slowly turn your head left and right: "No, no, no". Shrug your shoulders up to your ears and let them drop! Now march on the spot: one-two, one-two! Moving every day keeps our blood flowing and our minds sharp.',
        boardText: 'SAFE WARM-UP MOVEMENTS\n\n1. Head Nodding: Up and down gently\n2. Shoulder Rolls: Backward and forward\n3. Arm Reaches: Stretch high to touch the clouds!\n4. Knee Bends: Gentle bend and stand tall\n5. Spot Marching: Lift knees high, 1-2, 1-2!',
        bulletPoints: [
          'Keep your space: do not bump into classmates',
          'Breathe in fresh air through your nose, out through your mouth',
          'Drink clean water after exercising'
        ],
        equationOrHighlight: 'Exercise = Strong Heart + Happy Mind',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-phe-p1',
        question: 'Which body parts do you use to kick a football across the field?',
        concreteContext: 'Think about playing on the playground during games time.',
        options: ['Your Hands and Ears', 'Your Legs and Feet', 'Your Head and Teeth', 'Your Shoulders'],
        correctIndex: 1,
        explanation: 'We use our legs and feet to kick a ball, run, and jump.',
        visualAidIcon: '⚽'
      },
      {
        id: 'p1-phe-p2',
        question: 'When we nod our head up and down, what does that movement usually mean?',
        concreteContext: 'Do it right now: nod up and down gently.',
        options: ['It means "No"', 'It means "Yes"', 'It means "Sleep"', 'It means "Run"'],
        correctIndex: 1,
        explanation: 'Nodding the head up and down is a polite movement that usually means "Yes".',
        visualAidIcon: '🗣️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-phe-q1',
        question: 'Which of the following body parts is located on your upper body between your neck and your arms?',
        contextNigerian: 'Place your hands right here on your body.',
        options: ['Knees', 'Shoulders', 'Toes', 'Ankles'],
        correctAnswerIndex: 1,
        explanation: 'Our shoulders connect our neck to our arms on our upper body.',
        hint: 'In the song: "Head, shoulders, knees and toes!"'
      },
      {
        id: 'p1-phe-q2',
        question: 'Why is it important to do simple stretching exercises every morning before learning?',
        contextNigerian: 'Think about how you feel after morning assembly.',
        options: [
          'To make us feel sleepy and tired',
          'To keep our bodies active, flexible, and healthy',
          'To spoil our school uniform',
          'So we cannot write with our pencils'
        ],
        correctAnswerIndex: 1,
        explanation: 'Stretching and exercising keeps our muscles flexible and our minds awake and alert.',
        hint: 'It gives us energy and keeps our bodies strong.'
      },
      {
        id: 'p1-phe-q3',
        question: 'How many toes do we have on our two feet combined?',
        contextNigerian: 'Count 5 toes on your left foot and 5 toes on your right foot.',
        options: ['5 toes', '8 toes', '10 toes', '12 toes'],
        correctAnswerIndex: 2,
        explanation: 'We have 5 toes on each foot, making a total of 10 toes.',
        hint: 'Just like we have 10 fingers on our two hands.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: CHRISTIAN RELIGIOUS STUDIES
  // ==========================================
  {
    id: 'p1-t1-w1-chris',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Christian Religious Studies',
    topic: 'God the Creator (Part 1)',
    subtopic: 'God is the Supreme Creator who made the universe, Day 1 (Light & Darkness), and Day 2 (Sky & Clouds)',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · God Made Our Beautiful World (Day 1 & Day 2)',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Identify God as the Supreme Being and Loving Creator of the world',
      'Explain the creation of Day 1: God said "Let there be light", separating light (Day) from darkness (Night)',
      'Explain the creation of Day 2: God created the firmament, forming the beautiful sky and clouds',
      'Appreciate God’s love and wisdom in giving us day for work and night for restful sleep'
    ],
    lastWeekRevision: 'Welcome to Primary 1 Christian Religious Studies! We begin with the greatest story of all: how God created everything.',
    previousKnowledge: 'Pupils know that night is dark when they sleep, and morning brings bright sunlight for going to school.',
    concreteVisualAids: [
      {
        title: 'Day 1 Creation Picture (Light and Night)',
        description: 'Vivid illustration split in half: one side has bright sunshine and blue sky, the other has a glowing moon and stars.',
        itemType: 'shapes_chart',
        icon: '☀️',
        caption: 'Day 1: God Created Light'
      },
      {
        title: 'Day 2 Creation Picture (The Sky Above)',
        description: 'Peaceful picture of puffy white clouds and endless blue sky spanning above the earth.',
        itemType: 'shapes_chart',
        icon: '☁️',
        caption: 'Day 2: God Formed the Sky'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. God is the Supreme Creator',
        teacherSpeech: 'Welcome, dear scholars! Before there were trees, before there were houses, roads, or people, only God existed. God is the Almighty Supreme Being. God looked upon darkness and decided to create a magnificent world full of wonder for us to live in and enjoy.',
        boardText: 'GOD THE CREATOR\n\n• God is the Supreme Being\n• God has no beginning and no end\n• God created the world out of love\n• Everything God made is good and beautiful!',
        bulletPoints: [
          'God spoke and creation came to be',
          'God cares for every child and every creature',
          'We say "Thank You God" for life and light'
        ],
        equationOrHighlight: 'In the beginning, God created the heavens and the earth.',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Day 1 and Day 2 of Creation',
        teacherSpeech: 'On the very first day, the world was completely dark. God spoke with authority: "Let there be light!" And immediately, bright light appeared! God separated the light from the darkness. He called the light DAY, and the darkness NIGHT. On the second day, God formed the great expanse of the sky to divide the waters above and below. Look up outside—the beautiful blue sky with soft white clouds was made on Day 2!',
        boardText: 'THE FIRST TWO DAYS OF CREATION\n\n• DAY 1: Light and Darkness\n  - Light = DAY ☀️ (Time to learn, play, and work)\n  - Darkness = NIGHT 🌙 (Time to rest and sleep)\n\n• DAY 2: The Sky and Clouds ☁️\n  - God created the dome of the sky\n  - The sky protects our earth and gives us air to breathe',
        bulletPoints: [
          'Day 1 gave us day and night',
          'Day 2 gave us the expansive sky',
          'God saw that it was good!'
        ],
        equationOrHighlight: 'Day 1: Light & Night | Day 2: Sky & Clouds',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-crs-p1',
        question: 'What did God create on the very first day of creation when He said "Let there be light"?',
        concreteContext: 'Think of what shines into your bedroom in the morning.',
        options: ['Cars and Buses', 'Light and Darkness (Day and Night)', 'Computers and Phones', 'Fish in the Ocean'],
        correctIndex: 1,
        explanation: 'On Day 1, God created light and separated it from darkness, creating Day and Night.',
        visualAidIcon: '☀️'
      },
      {
        id: 'p1-crs-p2',
        question: 'What did God name the time of light?',
        concreteContext: 'What do we call the hours when the sun is up and you are at school?',
        options: ['Night', 'Day', 'Rain', 'Shadow'],
        correctIndex: 1,
        explanation: 'God called the light Day, and He called the darkness Night.',
        visualAidIcon: '🌅'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-crs-q1',
        question: 'Who is the Supreme Creator who made the heavens, the earth, and everything in them?',
        contextNigerian: 'Remember the opening verse of the Holy Bible.',
        options: ['A Carpenter', 'God Almighty', 'A King', 'A Pilot'],
        correctAnswerIndex: 1,
        explanation: 'God Almighty is the Supreme Being and Creator of the universe.',
        hint: 'He spoke and the world was formed.'
      },
      {
        id: 'p1-crs-q2',
        question: 'What did God create on Day 2 of creation that we see when we look up outside?',
        contextNigerian: 'Look up above the school roof into the open air.',
        options: ['The deep ocean trenches', 'The beautiful blue sky and clouds', 'Tarred roads and bridges', 'Gold coins'],
        correctAnswerIndex: 1,
        explanation: 'On Day 2, God created the sky (firmament) with its clouds.',
        hint: 'It is high above our heads, blue in color with white puffy clouds.'
      },
      {
        id: 'p1-crs-q3',
        question: 'Why did God give us the darkness of night time?',
        contextNigerian: 'What do you and your family do when darkness falls and the stars come out?',
        options: [
          'So we can play football in the dark',
          'For rest, peace, and healthy sleep',
          'So we cannot see our food',
          'Because God ran out of colors'
        ],
        correctAnswerIndex: 1,
        explanation: 'God in His wisdom gave us the night so our bodies and minds can rest and sleep peacefully.',
        hint: 'It is when we lie down on our bed to recharge for the next day.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: ISLAMIC STUDIES
  // ==========================================
  {
    id: 'p1-t1-w1-islam',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Islamic Studies',
    topic: 'Arabic Alphabet (Part 1)',
    subtopic: 'Introduction to the first seven Arabic letters: Alif, Baa, Taa, Thaa, Jeem, Haa, Khaa (أ ب ت ث ج ح خ)',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · First Steps in the Arabic Alphabet (أ to خ)',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Recognize and pronounce the first seven Arabic letters: Alif (أ), Baa (ب), Taa (ت), Thaa (ث), Jeem (ج), Haa (ح), Khaa (خ)',
      'Identify Arabic letters by reading from right to left as written in the Holy Quran',
      'Count and locate the dots (Nuqat) that differentiate Baa (1 dot below), Taa (2 dots above), and Thaa (3 dots above)',
      'Trace the shape of Alif and the boat letters with proper finger direction'
    ],
    lastWeekRevision: 'Assalamu Alaikum! Welcome to Primary 1 Islamic Studies. Learning Arabic helps us read the Holy Quran with love and reverence.',
    previousKnowledge: 'Pupils have heard Arabic recitations in prayers and recognize the greeting "Assalamu Alaikum".',
    concreteVisualAids: [
      {
        title: 'First 7 Arabic Letters Slate (Alif to Khaa)',
        description: 'Large wooden writing slate showing أ, ب, ت, ث, ج, ح, خ in clear calligraphy with bright red dot markers.',
        itemType: 'shapes_chart',
        icon: '📜',
        caption: 'Arabic Letters: أ ب ت ث ج ح خ'
      },
      {
        title: 'The Boat Letters Family Chart',
        description: 'Illustration comparing Baa (one dot under), Taa (two dots inside), and Thaa (three dots inside) like small canoes.',
        itemType: 'shapes_chart',
        icon: '🛶',
        caption: 'The Boat Family: Baa, Taa, Thaa'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Reading Right to Left & Letter Alif (أ)',
        teacherSpeech: 'Assalamu Alaikum, my lovely scholars! In Arabic, we read from right to left! Look at our first letter: ALIF (أ). It stands tall and straight like a walking stick or a tall pencil. When we say Alif, we open our mouth gently. Say it with me: "ALIF!"',
        boardText: 'THE ARABIC ALPHABET (READ RIGHT TO LEFT ➡️ ⬅️)\n\n1. أ (Alif) → Straight line from top to bottom\n• Sound: Clear open sound like /a/\n• Looks like: A standing staff or pencil ✏️',
        bulletPoints: [
          'Arabic is read from RIGHT to LEFT',
          'Alif is the very first letter',
          'Alif has no dots'
        ],
        equationOrHighlight: 'Letter 1: أ (Alif)',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. The Boat Family and The Curved Family',
        teacherSpeech: 'Now meet the Boat Family: Baa (ب), Taa (ت), and Thaa (ث). They all have the same boat shape, but notice the dots! Baa has ONE dot underneath (like a fish swimming under the boat). Taa has TWO dots inside at the top (like two friendly eyes). Thaa has THREE dots at the top! Next come the curved letters: Jeem (ج) has a dot in its tummy, Haa (ح) has no dot, and Khaa (خ) has a dot sitting on its head!',
        boardText: 'DOTS MAKE THE DIFFERENCE!\n\n• THE BOAT FAMILY:\n  - ب (Baa) → 1 dot BELOW\n  - ت (Taa) → 2 dots ABOVE\n  - ث (Thaa) → 3 dots ABOVE\n\n• THE CURVED FAMILY:\n  - ج (Jeem) → 1 dot in the tummy\n  - ح (Haa) → Clean! No dot at all\n  - خ (Khaa) → 1 dot on top of the head',
        bulletPoints: [
          'Count the dots to know the letter',
          'ب has one dot under the line',
          'ت has two dots on top',
          'ج, ح, خ share the same curved tail'
        ],
        equationOrHighlight: 'أ • ب • ت • ث • ج • ح • خ',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-is-p1',
        question: 'Which Arabic letter has ONE single dot underneath its boat shape?',
        concreteContext: 'Think of the letter with the dot below like a fish under water: ب.',
        options: ['Alif (أ)', 'Baa (ب)', 'Taa (ت)', 'Haa (ح)'],
        correctIndex: 1,
        explanation: 'Baa (ب) has one single dot placed directly below the letter shape.',
        visualAidIcon: 'ب'
      },
      {
        id: 'p1-is-p2',
        question: 'In which direction do we read and write Arabic text?',
        concreteContext: 'Remember: start on the side of your right hand!',
        options: ['From Top to Bottom only', 'From Right to Left', 'From Left to Right', 'From Bottom to Top'],
        correctIndex: 1,
        explanation: 'Arabic is written and read from right to left.',
        visualAidIcon: '➡️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-is-q1',
        question: 'What is the very first letter of the Arabic alphabet?',
        contextNigerian: 'It stands straight and tall with no dots.',
        options: ['Baa (ب)', 'Taa (ت)', 'Alif (أ)', 'Jeem (ج)'],
        correctAnswerIndex: 2,
        explanation: 'Alif (أ) is the first letter of the Arabic alphabet.',
        hint: 'It looks like a straight standing vertical line.'
      },
      {
        id: 'p1-is-q2',
        question: 'How many dots does the letter Taa (ت) have on top?',
        contextNigerian: 'Look at the two eyes sitting inside the boat: ت.',
        options: ['No dots', 'One dot', 'Two dots', 'Four dots'],
        correctAnswerIndex: 2,
        explanation: 'Taa (ت) has exactly two dots placed above the boat line.',
        hint: 'Count the dots: one, two!'
      },
      {
        id: 'p1-is-q3',
        question: 'Among the curved letters ج, ح, and خ, which one has NO dots at all?',
        contextNigerian: 'Look at the clean, smooth letter: ح.',
        options: ['Jeem (ج)', 'Haa (ح)', 'Khaa (خ)', 'Thaa (ث)'],
        correctAnswerIndex: 1,
        explanation: 'Haa (ح) is written completely clean without any dots.',
        hint: 'Jeem has a dot in its tummy and Khaa has a dot on its head.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: NIGERIAN HISTORY
  // ==========================================
  {
    id: 'p1-t1-w1-niger',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Nigerian History',
    topic: 'Meaning and Importance of History - Part 1',
    subtopic: 'What is history, true stories of the past, simple time concepts (yesterday, last year), and our family origins',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · True Stories of the Past: Welcome to History',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Define history simply as the true story of events, people, and places in the past',
      'Distinguish between what happened in the past (yesterday, when you were born) and the present (today)',
      'Explain how family history helps us understand who our parents, grandparents, and ancestors are',
      'Give two reasons why learning history is important for every Nigerian child'
    ],
    lastWeekRevision: 'Welcome to your first Nigerian History lesson in Primary 1! Every person, family, and great nation has a story.',
    previousKnowledge: 'Pupils know that their parents were once little children and that their grandparents have lived for a long time.',
    concreteVisualAids: [
      {
        title: 'Family Timeline Photo Card',
        description: 'Three pictures side by side: 1. Grandparents long ago in traditional attire, 2. Parents holding baby, 3. The pupil entering Primary 1 today.',
        itemType: 'shapes_chart',
        icon: '👨‍👩‍👧‍👦',
        caption: 'Our Family Story Through Time'
      },
      {
        title: 'Past vs Present In Everyday Life',
        description: 'Illustrations comparing a clay water pot used long ago with a clean plastic water bottle used in school today.',
        itemType: 'shapes_chart',
        icon: '🏺',
        caption: 'How Things Change Over Time'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is History?',
        teacherSpeech: 'Hello future leaders! Have you ever listened to your grandmother tell you a story by the fireside or in the living room? History is the true story of things that happened in the past. It is not an imaginary cartoon or a made-up movie. History tells us the real truth about what happened yesterday, last month, fifty years ago, or hundreds of years ago in our homeland, Nigeria!',
        boardText: 'WHAT IS HISTORY?\n\n• History = The true story of the past!\n• "The Past" means time that has already gone by:\n  - Yesterday when you ate dinner 🍲\n  - When you were a tiny crawling baby 👶\n  - When your parents went to school 🎒\n  - When Nigeria was young 🇳🇬',
        bulletPoints: [
          'History tells real stories of real people',
          'History explains how we got to where we are today',
          'Knowing our past makes us proud and wise'
        ],
        equationOrHighlight: 'History = True Story of the Past',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Why Do We Study History?',
        teacherSpeech: 'Why do we study history? First, history helps us know our family. When your parents tell you about your village, your town, and your great-grandparents, you learn your roots! Second, history teaches us lessons from brave heroes who built our schools, hospitals, and towns. By learning about good deeds in the past, we learn how to be good citizens today.',
        boardText: 'WHY WE STUDY HISTORY\n\n1. To Know Our Roots: Where our family and town came from\n2. To Learn from the Past: What worked well and what mistakes to avoid\n3. To Celebrate Our Heroes: Men and women who built our nation\n4. To Love Our Country: Knowing Nigeria’s rich culture and heritage',
        bulletPoints: [
          'Every Nigerian community has a rich history',
          'We listen carefully to stories told by our elders',
          'We keep old family photographs and memories safe'
        ],
        equationOrHighlight: 'Learn from Yesterday · Live Well Today · Lead Tomorrow',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-his-p1',
        question: 'Which of the following describes what "History" is?',
        concreteContext: 'Remember what Mallama Zainab explained about real stories.',
        options: [
          'A cartoon about talking animals',
          'The true story of events and people in the past',
          'A game played with football on the field',
          'A recipe for cooking jollof rice'
        ],
        correctIndex: 1,
        explanation: 'History is the true record and story of what really happened in the past.',
        visualAidIcon: '📖'
      },
      {
        id: 'p1-his-p2',
        question: 'Which of these events belongs to your own personal past history?',
        concreteContext: 'Think of something that already happened before today.',
        options: [
          'What you will eat tomorrow morning',
          'The day you took your first steps as a baby',
          'Your graduation from university in 15 years',
          'Next year Christmas celebration'
        ],
        correctIndex: 1,
        explanation: 'The day you took your first steps as a baby already happened in the past, so it is part of your history.',
        visualAidIcon: '👶'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-his-q1',
        question: 'What word do we use for the time that has already happened, like yesterday or last year?',
        contextNigerian: 'Is it the future, or is it the past?',
        options: ['The Future', 'Tomorrow', 'The Past', 'Next Week'],
        correctAnswerIndex: 2,
        explanation: 'The past refers to all the days and years that have already passed by.',
        hint: 'It is behind us in time, like yesterday.'
      },
      {
        id: 'p1-his-q2',
        question: 'Who can tell us true stories about what our family and hometown were like long ago?',
        contextNigerian: 'Think of the respected elders in your family.',
        options: [
          'A baby who cannot speak yet',
          'Our parents, grandparents, and elders',
          'A toy teddy bear',
          'A strange stranger in the street'
        ],
        correctAnswerIndex: 1,
        explanation: 'Our parents and grandparents have lived through many years and can tell us our family history.',
        hint: 'They have grey hair and remember when our parents were small.'
      },
      {
        id: 'p1-his-q3',
        question: 'Why is it good for Nigerian children to study the history of our country?',
        contextNigerian: 'Think about how learning about Nigeria makes us proud citizens.',
        options: [
          'So we can forget our family names',
          'To learn good lessons, know our culture, and love our homeland',
          'So we do not have to do our school homework',
          'To argue with our school teachers'
        ],
        correctAnswerIndex: 1,
        explanation: 'Learning history helps us understand our rich culture, learn from the past, and grow into great leaders.',
        hint: 'It helps us know how our nation became great.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: SOCIAL & CITIZENSHIP STUDIES
  // ==========================================
  {
    id: 'p1-t1-w1-socia',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Social and Citizenship Studies',
    topic: 'Leadership',
    subtopic: 'Understanding what leadership means, leaders in our daily lives, and qualities of a good leader',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Guiding and Caring: What is a Good Leader?',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Explain what a leader is: someone who guides, cares for, and directs others in doing good',
      'Name leaders in our daily surroundings: parents at home, teachers in class, headteacher in school, community chiefs',
      'Identify four core qualities of a good leader: kindness, honesty, fairness, and helpfulness',
      'Demonstrate respect and obedience to rightful leaders in the classroom and at home'
    ],
    lastWeekRevision: 'Welcome to Social and Citizenship Studies in Primary 1! We learn how to live peacefully together in our community.',
    previousKnowledge: 'Pupils know that their parents set rules at home and their teacher guides them in class.',
    concreteVisualAids: [
      {
        title: 'Leaders in Our Everyday Life Poster',
        description: 'Drawing of four community leaders: Mother and Father caring for children, Teacher helping pupils write, Headteacher at morning assembly.',
        itemType: 'shapes_chart',
        icon: '🧑‍🤝‍🧑',
        caption: 'Our Daily Leaders'
      },
      {
        title: 'The Good Leader Badge of Qualities',
        description: 'Four colorful symbols: A Heart (Kindness), A Scale (Fairness), Open Hands (Helpfulness), and A Clean Slate (Honesty).',
        itemType: 'shapes_chart',
        icon: '⭐',
        caption: 'Qualities of a Great Leader'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is a Leader?',
        teacherSpeech: 'Welcome, young citizens! A leader is someone who shows the way, guides others, and takes care of a group so that everyone is safe, happy, and successful. When a flock of birds flies in the sky, one bird leads the way. In our classroom, when we walk to the library, the line leader walks gently in front so no one gets lost!',
        boardText: 'WHAT IS A LEADER?\n\n• A Leader = Someone who guides, directs, and helps others.\n• Leaders in Our Lives:\n  - At HOME 🏠: Our Mother and Father (Parents)\n  - In CLASSROOM 🏫: Our Teacher\n  - In SCHOOL 🏢: The Headteacher / Principal\n  - In COMMUNITY 🏘️: Village Head, Oba, Emir, or Eze',
        bulletPoints: [
          'A good leader serves and protects the group',
          'Without leaders, there would be confusion and quarreling',
          'Good leaders listen to those they lead'
        ],
        equationOrHighlight: 'A Leader Guides with Wisdom and Love',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Qualities of a Good Leader',
        teacherSpeech: 'What makes someone a truly great leader? A good leader is NOT a bully who shouts or takes other children’s pencils. No! A good leader is KIND to everyone, HONEST by always telling the truth, FAIR by sharing treats equally, and HELPFUL when someone falls or struggles with classwork. You too can be a great leader in Primary 1!',
        boardText: 'QUALITIES OF A GOOD LEADER\n\n1. ❤️ KINDNESS: Treats everyone with respect and care\n2. 🤝 HONESTY: Always tells the truth and keeps promises\n3. ⚖️ FAIRNESS: Treats all children equally without favoritism\n4. 🤲 HELPFULNESS: Assists those who need support',
        bulletPoints: [
          'A leader leads by good example',
          'We greet and respect our leaders politely',
          'Every child in Primary 1 can practice being a leader'
        ],
        equationOrHighlight: 'Kind • Honest • Fair • Helpful',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-soc-p1',
        question: 'Who is the primary leader that guides and teaches pupils inside our classroom every day?',
        concreteContext: 'Look at the teacher standing at the whiteboard.',
        options: ['The Class Teacher', 'A Stranger on the road', 'A Little Puppy', 'A Television set'],
        correctIndex: 0,
        explanation: 'The class teacher is the leader who guides pupils and teaches lessons in the classroom.',
        visualAidIcon: '👩🏾‍🏫'
      },
      {
        id: 'p1-soc-p2',
        question: 'Which of the following actions shows that a class captain is a GOOD leader?',
        concreteContext: 'Think about kindness and fairness.',
        options: [
          'Taking other children’s snacks without asking',
          'Helping a classmate who dropped their pencils pick them up',
          'Pushing friends on the staircase',
          'Shouting loudly during quiet reading time'
        ],
        correctIndex: 1,
        explanation: 'Helping a friend pick up fallen pencils shows kindness and helpful leadership.',
        visualAidIcon: '🤝'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-soc-q1',
        question: 'Who are the leaders God gave you to protect and care for you inside your home?',
        contextNigerian: 'Think of who provides your food, clothes, and shelter at home.',
        options: ['Your Parents (Mother and Father)', 'The bus driver', 'The shopkeeper down the street', 'A visitor'],
        correctAnswerIndex: 0,
        explanation: 'Parents are the God-given leaders of the home who love, guide, and protect their children.',
        hint: 'They wake you up, prepare your breakfast, and pray for you.'
      },
      {
        id: 'p1-soc-q2',
        question: 'Which of these is a very important quality of a good leader?',
        contextNigerian: 'Look at the qualities of a trustworthy person.',
        options: ['Selfishness', 'Honesty and telling the truth', 'Rudeness', 'Fighting during break time'],
        correctAnswerIndex: 1,
        explanation: 'Honesty is a core quality of a good leader because people must trust their leader.',
        hint: 'It means speaking the truth at all times.'
      },
      {
        id: 'p1-soc-q3',
        question: 'Why do we need a headteacher in our primary school?',
        contextNigerian: 'Think about who oversees the entire school compound.',
        options: [
          'To eat all the school biscuits',
          'To keep the school organized, safe, and peaceful for learning',
          'To hide the books from children',
          'So teachers do not come to school'
        ],
        correctAnswerIndex: 1,
        explanation: 'The headteacher manages the teachers and pupils so the whole school is safe and orderly.',
        hint: 'They ensure everything runs smoothly from morning assembly to dismissal.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 1 - TERM 1 - WEEK 1: CULTURAL & CREATIVE ARTS
  // ==========================================
  {
    id: 'p1-t1-w1-cultu',
    grade: 1,
    term: 1,
    week: 1,
    subject: 'Cultural and Creative Arts',
    topic: 'Art: Introduction to Art',
    subtopic: 'Understanding what art is (creating beautiful things), forms of art (drawing, coloring, crafts), and art materials',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · The Joy of Colors & Shapes: What is Art?',
    isFree: true,
    teacherId: 'zainab',
    status: 'IN_PROGRESS',
    objectives: [
      'Define art simply as the creation of beautiful and meaningful things using our imagination and hands',
      'Identify different forms of visual art: drawing with pencils, coloring with wax crayons, painting, and paper crafts',
      'Name common art materials used in our classroom: paper, pencils, wax crayons, eraser, ruler, and paintbrushes',
      'Demonstrate proper handling and care of coloring materials without breaking them or scribbling on walls'
    ],
    lastWeekRevision: 'Welcome to your first Cultural and Creative Arts lesson in Primary 1! Today we explore colors, imagination, and beauty.',
    previousKnowledge: 'Pupils love scribbling with crayons, looking at picture books, and noticing bright colors on clothes and flowers.',
    concreteVisualAids: [
      {
        title: 'Classroom Art Materials Display Tray',
        description: 'Neatly organized wooden tray holding a box of 12 wax crayons, drawing pencils, white paper sheets, and an eraser.',
        itemType: 'shapes_chart',
        icon: '🎨',
        caption: 'Our Art Tools'
      },
      {
        title: 'Colorful Pattern Picture Card',
        description: 'Vibrant Nigerian pattern showing yellow sunshine, red hibiscus flowers, and green leaves drawn with crayons.',
        itemType: 'shapes_chart',
        icon: '🖍️',
        caption: 'Drawing with Primary Colors'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is Art?',
        teacherSpeech: 'Hello creative artists! Look at your clothes, look at the colorful illustrations in your reading book, look at the bright flags in the school yard. All of that was designed through ART! Art is the wonderful way we use our imagination, our hearts, and our hands to create beautiful things that bring joy to others.',
        boardText: 'WHAT IS ART?\n\n• Art = Creating beautiful things with our imagination and hands! 🎨\n• Forms of Art in Primary 1:\n  - ✏️ Drawing: Making lines and shapes with pencils\n  - 🖍️ Coloring: Filling shapes with bright crayons\n  - 🖌️ Painting: Spreading colors with a soft brush\n  - ✂️ Paper Craft: Folding and pasting clean paper shapes',
        bulletPoints: [
          'Art helps us express our thoughts and feelings',
          'Everyone can create art in their own unique way',
          'Art makes our classrooms and homes beautiful'
        ],
        equationOrHighlight: 'Imagination + Hands = Beautiful Art!',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Art Tools and Caring for Our Materials',
        teacherSpeech: 'To make art, artists need tools! In our classroom, our most important tools are clean white paper, a sharp HB pencil, and colorful wax crayons. When using your crayons, hold them gently near the tip so they do not snap. And remember our golden rule: we color only on our paper sketchpads, NEVER on classroom walls or desks!',
        boardText: 'OUR ART TOOLS & CARE RULES\n\n• Common Art Materials:\n  1. Plain drawing paper or sketchpad 📄\n  2. Lead pencil & soft eraser ✏️\n  3. Wax crayons & colored pencils 🖍️\n\n• GOLDEN RULES OF THE ART CLASS:\n  ✅ Color inside your drawing book\n  ✅ Put crayons back in their box after use\n  ❌ Do not write or draw on walls or desks',
        bulletPoints: [
          'Take care of your art materials so they last all term',
          'Share colors politely with your desk partner',
          'Always wash your hands after art class'
        ],
        equationOrHighlight: 'Color on Paper · Care for Your Tools',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p1-cca-p1',
        question: 'Which of these materials do we use in our classroom to add bright colors to our drawings?',
        concreteContext: 'Look inside your pencil case for the colorful sticks.',
        options: ['A sharp pair of scissors', 'A box of wax crayons', 'A wooden broom', 'A bottle of water'],
        correctIndex: 1,
        explanation: 'Wax crayons are used to color pictures with bright colors like red, yellow, and blue.',
        visualAidIcon: '🖍️'
      },
      {
        id: 'p1-cca-p2',
        question: 'Where should a good Primary 1 pupil draw their art pictures?',
        concreteContext: 'Remember Mallama Zainab’s golden rule for art.',
        options: ['On the classroom wall', 'Inside their own drawing sketchpad', 'On the teacher’s chair', 'On the floor'],
        correctIndex: 1,
        explanation: 'We always draw and color inside our drawing sketchpad or on clean paper, never on walls or furniture.',
        visualAidIcon: '📄'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p1-cca-q1',
        question: 'What is art?',
        contextNigerian: 'Think about making something lovely with your hands.',
        options: [
          'Breaking classroom windows with stones',
          'Creating beautiful things with our imagination and hands',
          'Sleeping during afternoon lessons',
          'Refusing to eat lunch'
        ],
        correctAnswerIndex: 1,
        explanation: 'Art is the joyful creation of beautiful things using our minds and hands.',
        hint: 'It brings beauty and happiness to our eyes.'
      },
      {
        id: 'p1-cca-q2',
        question: 'Which of the following is a tool used for drawing the initial outline of a picture?',
        contextNigerian: 'You use this to draw lines before coloring them in.',
        options: ['A pencil', 'A water cup', 'A lunchbox', 'A wristwatch'],
        correctAnswerIndex: 0,
        explanation: 'A pencil is used by artists to draw outlines, shapes, and figures.',
        hint: 'It has graphite inside and makes a grey line on paper.'
      },
      {
        id: 'p1-cca-q3',
        question: 'After finishing your drawing, what is the right thing to do with your crayons and pencils?',
        contextNigerian: 'Think of keeping your desk neat and tidy.',
        options: [
          'Throw them on the classroom floor',
          'Pack them neatly back into your pencil pouch or box',
          'Break them in half and give them away',
          'Leave them under your desk'
        ],
        correctAnswerIndex: 1,
        explanation: 'Caring for art tools means packing them neatly into their box so they remain clean and ready for next time.',
        hint: 'Put them away safely so they do not get stepped on or lost.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 2 - TERM 1 - WEEK 1: MATHEMATICS
  // ==========================================
  {
    id: 'p2-t1-w1-mathe',
    grade: 2,
    term: 1,
    week: 1,
    subject: 'Mathematics',
    topic: 'Whole Numbers (1–100)',
    subtopic: 'Counting 1 to 100, Place Value (Tens and Units), Reading and Writing in Words',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Whole Numbers 1 to 100 & Place Value Bundles',
    isFree: true,
    teacherId: 'chidinma',
    status: 'IN_PROGRESS',
    objectives: [
      'Count, read, and write whole numbers from 1 to 100 in figures and words',
      'Identify the place value of digits in 2-digit numbers (Tens and Units)',
      'Represent numbers up to 100 using bundles of 10 counting sticks and single units',
      'Order numbers from smallest to largest and largest to smallest'
    ],
    lastWeekRevision: 'In Primary 1, we learned numbers 1 to 50. Today we expand to 100!',
    previousKnowledge: 'Pupils can count forward to 50 and group items in simple pairs and fives.',
    concreteVisualAids: [
      {
        title: 'Bundles of 10 Counting Sticks',
        description: 'Ten bundles of broomsticks, each tied with a rubber band to represent 1 Ten.',
        itemType: 'cowries',
        icon: '🥢',
        caption: '1 Bundle = 1 Ten (10 Units)'
      },
      {
        title: '100-Square Number Grid',
        description: 'A 10x10 colorful chart showing numbers 1 through 100.',
        itemType: 'shapes_chart',
        icon: '🔢',
        caption: '100-Square Number Board'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Grouping in Tens and Units',
        teacherSpeech: 'Welcome to Primary 2! Today we count up to 100. Look at these sticks. Instead of counting single sticks all day, we tie 10 sticks together into a bundle. One bundle is called 1 TEN. If we have 3 bundles and 4 loose sticks, we have 3 Tens and 4 Units = 34!',
        boardText: 'PLACE VALUE: TENS (T) & UNITS (U)\n\n• Number 34:\n  3 Tens = 30\n  4 Units = 4\n  30 + 4 = 34 (Thirty-four)\n\n• Number 50:\n  5 Tens = 50\n  0 Units = 0',
        bulletPoints: [
          'Units = Single loose objects (0 to 9)',
          'Tens = Bundles of 10 objects',
          '10 Tens together make ONE HUNDRED (100)'
        ],
        equationOrHighlight: 'Tens (T) | Units (U) -> 3 Tens + 4 Units = 34',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Writing Numbers in Words',
        teacherSpeech: 'Let us practice writing numbers in words. 10 is ten, 20 is twenty, 30 is thirty, 40 is forty, and 100 is one hundred!',
        boardText: 'NUMBERS IN WORDS\n\n• 14 = Fourteen\n• 40 = Forty (Notice: F-O-R-T-Y)\n• 75 = Seventy-five\n• 100 = One hundred',
        bulletPoints: [
          'Read the Tens first, then the Units',
          'Always put a hyphen between tens and units: twenty-five, sixty-three'
        ],
        equationOrHighlight: '40 = Forty | 100 = One Hundred',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p2-w1-p1',
        question: 'In the number 57, what is the place value of the digit 5?',
        concreteContext: '57 has 5 bundles of ten and 7 loose units.',
        options: ['Units', 'Tens', 'Hundreds', 'Thousands'],
        correctIndex: 1,
        explanation: 'In 57, the digit 5 is in the Tens place (5 Tens = 50).',
        visualAidIcon: '🥢'
      },
      {
        id: 'p2-w1-p2',
        question: 'How do you write the number 48 in words?',
        concreteContext: 'Say the tens part first, then the units.',
        options: ['Four eight', 'Fourteen-eight', 'Forty-eight', 'Forty and eight'],
        correctIndex: 2,
        explanation: '48 is written as "Forty-eight".',
        visualAidIcon: '📝'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p2-w1-q1',
        question: 'What is the value of 6 Tens and 3 Units?',
        contextNigerian: 'Combine 6 bundles of ten sticks and 3 single sticks.',
        options: ['36', '63', '603', '9'],
        correctAnswerIndex: 1,
        explanation: '6 Tens (60) + 3 Units (3) = 63.',
        hint: 'Put the 6 in the Tens column and 3 in the Units column.'
      },
      {
        id: 'p2-w1-q2',
        question: 'Which of the following numbers is the greatest?',
        contextNigerian: 'Compare the tens digits first.',
        options: ['68', '86', '79', '81'],
        correctAnswerIndex: 1,
        explanation: '86 has 8 tens and 6 units, which is greater than 81, 79, and 68.',
        hint: 'Both 86 and 81 have 8 tens. Which has more units?'
      },
      {
        id: 'p2-w1-q3',
        question: 'What number comes immediately after 99 when counting forward?',
        contextNigerian: 'Think about when you add 1 more to 99.',
        options: ['98', '100', '101', '110'],
        correctAnswerIndex: 1,
        explanation: '99 + 1 = 100 (One Hundred).',
        hint: 'It is a 3-digit number with two zeros.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 3 - TERM 1 - WEEK 1: BASIC SCIENCE
  // ==========================================
  {
    id: 'p3-t1-w1-basic',
    grade: 3,
    term: 1,
    week: 1,
    subject: 'Basic Science & Technology',
    topic: 'Measurement of Length I',
    subtopic: 'Meaning of Length, Traditional Units (Handspan, Arm length, Footsteps) and Metric Units',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Understanding Length & Measurement Methods',
    isFree: true,
    teacherId: 'emeka',
    status: 'IN_PROGRESS',
    objectives: [
      'Define length as the distance between two points',
      'Identify traditional non-standard methods of measuring length (handspan, footsteps, arm length, cubit)',
      'Explain the limitations of traditional measurement methods',
      'Introduce standard metric units of length: centimeters (cm) and meters (m)'
    ],
    lastWeekRevision: 'Welcome to Primary 3 Basic Science! We observe, measure, and explore the physical world around us.',
    previousKnowledge: 'Pupils know that some objects are tall, long, short, or wide.',
    concreteVisualAids: [
      {
        title: 'Traditional Handspan vs Ruler',
        description: 'Illustration showing an outstretched palm (handspan) next to a 30cm plastic school ruler.',
        itemType: 'shapes_chart',
        icon: '🖐️',
        caption: 'Handspan vs. 30cm Metric Ruler'
      },
      {
        title: 'Measuring Tape & Metre Rule',
        description: 'A wooden 1-metre ruler used by teachers and a flexible tailor measuring tape.',
        itemType: 'measuring_cylinder',
        icon: '📏',
        caption: 'Standard Measuring Tools'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. What is Length?',
        teacherSpeech: 'Good day champions! Today in Basic Science, we study length. Length is how long something is from one end to another end. If you measure the distance from your classroom door to the blackboard, that distance is length!',
        boardText: 'MEANING OF LENGTH\n\n• Length is the distance between two fixed points or edges.\n• Examples:\n  - Length of your pencil\n  - Length of your classroom desk\n  - Height of your school flagpole',
        bulletPoints: [
          'Length measures distance: long, short, wide, tall',
          'Everything around us has a measurable length'
        ],
        equationOrHighlight: 'Length = Distance from Point A to Point B',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Traditional vs Standard Units',
        teacherSpeech: 'Long ago before rulers were made, our grandfathers measured using their bodies: handspans, footsteps, and arm lengths! But why is a handspan not accurate? Because a child has a small hand and an adult teacher has a big hand! That is why we now use standard units: centimeters (cm) and meters (m).',
        boardText: 'MEASURING UNITS\n\n1. Traditional (Non-standard):\n   • Handspan (from tip of thumb to little finger)\n   • Footstep (paces along the floor)\n   • Arm length (cubit)\n   ⚠️ Problem: Everyone’s body is different!\n\n2. Standard (Metric):\n   • Centimetre (cm) for small objects (pencils, books)\n   • Metre (m) for larger distances (doors, rooms)\n   • 100 cm = 1 Metre',
        bulletPoints: [
          'Standard units give the same measurement anywhere in the world',
          'A 30cm ruler in Lagos is the exact same length as a 30cm ruler in Kano!'
        ],
        equationOrHighlight: '100 cm = 1 Metre (m)',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p3-sci-p1',
        question: 'Which of these is a traditional (non-standard) unit of measuring length?',
        concreteContext: 'Think of what our ancestors used before rulers were invented.',
        options: ['Centimeter', 'Handspan', 'Meter', 'Kilometer'],
        correctIndex: 1,
        explanation: 'A handspan uses the human palm and is a non-standard traditional unit.',
        visualAidIcon: '🖐️'
      },
      {
        id: 'p3-sci-p2',
        question: 'How many centimeters (cm) are in 1 meter (m)?',
        concreteContext: 'Look at the markings on a 1-meter stick.',
        options: ['10 cm', '50 cm', '100 cm', '1000 cm'],
        correctIndex: 2,
        explanation: 'There are exactly 100 centimeters in 1 meter (100 cm = 1 m).',
        visualAidIcon: '📏'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p3-sci-q1',
        question: 'Why do scientists and builders use standard rulers instead of footsteps to measure a room?',
        contextNigerian: 'Consider what happens when a tall person and a small pupil pace the same room.',
        options: [
          'Because footsteps are too fast',
          'Because everyone’s footstep size is different, so it gives inaccurate results',
          'Because rulers are cheaper than shoes',
          'Because footsteps can only measure water'
        ],
        correctAnswerIndex: 1,
        explanation: 'Different people have different foot and hand sizes, making non-standard measurements inconsistent.',
        hint: 'Think about whether your shoe is the same size as your parent’s shoe.'
      },
      {
        id: 'p3-sci-q2',
        question: 'Which instrument would a tailor use to measure your waist for a new school uniform?',
        contextNigerian: 'Think about the flexible tool the tailor wraps around you.',
        options: ['Thermometer', 'Measuring tape', 'Weighing scale', 'Stopwatch'],
        correctAnswerIndex: 1,
        explanation: 'A tailor uses a flexible measuring tape to measure body curves and lengths.',
        hint: 'It can bend easily around a person’s body.'
      },
      {
        id: 'p3-sci-q3',
        question: 'What is the best standard unit to measure the length of an exercise book?',
        contextNigerian: 'Is a notebook huge like a football field or small?',
        options: ['Kilometers (km)', 'Centimeters (cm)', 'Litres (L)', 'Kilograms (kg)'],
        correctAnswerIndex: 1,
        explanation: 'Small objects like exercise books and pens are measured in centimeters (cm).',
        hint: 'Look at the numbers on a student desk ruler.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 5 - TERM 1 - WEEK 1: MATHEMATICS
  // ==========================================
  {
    id: 'p5-t1-w1-mathe',
    grade: 5,
    term: 1,
    week: 1,
    subject: 'Mathematics',
    topic: 'Whole Numbers I (Numbers & Numeration)',
    subtopic: 'Place Value up to Millions, Reading, Writing, and Comparing Large Numbers',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Numbers up to Millions & Place Value Mastery',
    isFree: true,
    teacherId: 'ibrahim',
    status: 'IN_PROGRESS',
    objectives: [
      'Read and write whole numbers up to 1,000,000 (One Million) in figures and words',
      'State the place value of any digit up to 7-digit numbers',
      'Expand large numbers in terms of place values',
      'Compare and order numbers up to millions using symbols (>, <, =)'
    ],
    lastWeekRevision: 'In Primary 4, we mastered numbers up to 100,000. Now in Primary 5, we enter the Millions period!',
    previousKnowledge: 'Pupils understand Units, Tens, Hundreds, Thousands, and Ten Thousands.',
    concreteVisualAids: [
      {
        title: '7-Column Place Value Chart',
        description: 'Chart showing Millions (M), Hundred Thousands (HTh), Ten Thousands (TTh), Thousands (Th), Hundreds (H), Tens (T), Units (U).',
        itemType: 'shapes_chart',
        icon: '📊',
        caption: 'Place Value up to Millions'
      },
      {
        title: 'Federal Budget & Population Analogy',
        description: 'Examples showing population of major Nigerian cities (e.g. Kano state population: over 10 million).',
        itemType: 'nigerian_map',
        icon: '🏙️',
        caption: 'Real-Life Large Numbers in Nigeria'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. The Millions Place Value Chart',
        teacherSpeech: 'Welcome to Primary 5 Mathematics! As future leaders and scholars, you must handle large figures like town populations and government investments. To read a 7-digit number, we group digits into groups of three called periods: Units Period, Thousands Period, and Millions Period!',
        boardText: '7-DIGIT PLACE VALUE CHART\n\n[Millions] | [Thousands Period] | [Units Period]\n    M      |  HTh   TTh   Th   |   H    T    U\n    3      |   4     8     2   |   5    1    9\n\n• Number: 3,482,519\n• Read as: Three Million, Four Hundred and Eighty-Two Thousand, Five Hundred and Nineteen',
        bulletPoints: [
          'Group digits in threes starting from the right (Units)',
          'Insert commas between periods for easy reading',
          'Read the number in each period followed by its period name'
        ],
        equationOrHighlight: '3,482,519 = 3M + 400Th + 80Th + 2Th + 5H + 1T + 9U',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Expanded Notation & Comparison',
        teacherSpeech: 'To find the value of a digit, multiply the digit by its place value. In 5,320,410, the digit 5 has a value of 5 x 1,000,000 = 5,000,000! When comparing two large numbers, look at the highest place value from the left first.',
        boardText: 'EXPANDED FORM & COMPARISON\n\n• 5,320,410 = 5,000,000 + 300,000 + 20,000 + 400 + 10\n\n• Comparing:\n  4,520,300  vs  4,519,999\n  Both have 4 Millions and 5 Hundred Thousands.\n  Compare Ten Thousands: 20,000 > 10,000!\n  Therefore: 4,520,300 > 4,519,999',
        bulletPoints: [
          '> means greater than',
          '< means less than',
          '= means equal to'
        ],
        equationOrHighlight: '4,520,300 > 4,519,999',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p5-mat-p1',
        question: 'In the number 7,458,921, what is the place value of the digit 7?',
        concreteContext: 'Look at the 7th column from the right.',
        options: ['Hundred Thousands', 'Ten Thousands', 'Millions', 'Billions'],
        correctIndex: 2,
        explanation: 'The digit 7 is in the Millions column (Value = 7,000,000).',
        visualAidIcon: '📊'
      },
      {
        id: 'p5-mat-p2',
        question: 'Which symbol correctly completes: 1,250,000 ___ 1,249,999?',
        concreteContext: 'Compare the thousands: 50 thousands vs 49 thousands.',
        options: ['<', '>', '=', '≤'],
        correctIndex: 1,
        explanation: '1,250,000 is greater than 1,249,999 by 1 unit.',
        visualAidIcon: '⚖️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p5-mat-q1',
        question: 'How is the number 2,050,400 written in words?',
        contextNigerian: 'Read period by period: Millions, Thousands, Units.',
        options: [
          'Two million, fifty thousand, four hundred',
          'Two million, five hundred thousand, four hundred',
          'Twenty million, five thousand, four hundred',
          'Two hundred and fifty thousand, four hundred'
        ],
        correctAnswerIndex: 0,
        explanation: '2 is in Millions, 050 is fifty thousand, and 400 is four hundred.',
        hint: 'Look at the thousands period: 050 means fifty.'
      },
      {
        id: 'p5-mat-q2',
        question: 'What is the value of the digit 8 in 6,841,200?',
        contextNigerian: 'Multiply 8 by its position (Hundred Thousands).',
        options: ['8,000', '80,000', '800,000', '8,000,000'],
        correctAnswerIndex: 2,
        explanation: '8 is in the Hundred Thousands place, so its value is 800,000.',
        hint: '8 followed by five zeros.'
      },
      {
        id: 'p5-mat-q3',
        question: 'Arrange these figures in ascending order (smallest to largest): 3,100,000; 2,900,000; 3,050,000',
        contextNigerian: 'Ascending means climbing up from the lowest number.',
        options: [
          '3,100,000; 3,050,000; 2,900,000',
          '2,900,000; 3,050,000; 3,100,000',
          '2,900,000; 3,100,000; 3,050,000',
          '3,050,000; 2,900,000; 3,100,000'
        ],
        correctAnswerIndex: 1,
        explanation: '2.9M is smallest, followed by 3.05M, and 3.1M is largest.',
        hint: 'Start with 2,900,000 because 2 million is less than 3 million.'
      }
    ]
  },

  // ==========================================
  // PRIMARY 6 - TERM 1 - WEEK 1: MATHEMATICS
  // ==========================================
  {
    id: 'p6-t1-w1-mathe',
    grade: 6,
    term: 1,
    week: 1,
    subject: 'Mathematics',
    topic: 'Whole Numbers I',
    subtopic: 'Place Value up to Millions and Billions, Reading, Writing, Rounding Off, and Roman Numerals',
    weekType: 'instructional',
    periodTitle: 'Instructional Week 1 · Numbers up to Billions & Common Entrance Preparation',
    isFree: true,
    teacherId: 'babatunde',
    status: 'IN_PROGRESS',
    objectives: [
      'Read and write large whole numbers up to Billions in figures and words',
      'Identify place values of digits in 10-digit numbers',
      'Round off numbers to the nearest 10, 100, 1000, and 1,000,000',
      'Read and write Roman numerals up to 1,000 (M)'
    ],
    lastWeekRevision: 'Welcome to Primary 6! This is your final primary year. We prepare thoroughly for the National Common Entrance Examination.',
    previousKnowledge: 'Pupils can read and manipulate numbers up to Millions from Primary 5.',
    concreteVisualAids: [
      {
        title: 'National Population and National Revenue Scale',
        description: 'Examples showing Nigeria population (over 200 million) and federal budgets in Trillions and Billions of Naira.',
        itemType: 'nigerian_map',
        icon: '🇳🇬',
        caption: 'National Figures in Billions'
      },
      {
        title: 'Roman Numerals Anchor Chart',
        description: 'Chart listing I (1), V (5), X (10), L (50), C (100), D (500), M (1000).',
        itemType: 'shapes_chart',
        icon: '🏛️',
        caption: 'Roman Numerals up to 1,000 (M)'
      }
    ],
    whiteboardSteps: [
      {
        stepNumber: 1,
        title: '1. Numbers up to Billions (10 Digits)',
        teacherSpeech: 'Bawo ni, scholars! Welcome to Primary 6. Today we step into Billions. One Billion is 1 followed by nine zeros: 1,000,000,000. It is equal to one thousand millions! Let us see how the periods work together.',
        boardText: 'THE 4 PERIODS OF LARGE NUMBERS\n\n[Billions] | [Millions] | [Thousands] | [Units]\n    B      |   H  T  U  |   H  T  U   |  H  T  U\n    4      |   2  5  0  |   1  8  0   |  6  0  0\n\n• Read as: Four Billion, Two Hundred and Fifty Million, One Hundred and Eighty Thousand, Six Hundred.',
        bulletPoints: [
          '1 Billion = 1,000,000,000 (10 digits)',
          'Commas separate each 3-digit period',
          'Read each group of three digits just like in Primary 3, then add the period name'
        ],
        equationOrHighlight: '1 Billion = 1,000 Million = 1,000,000,000',
        diagramSvgType: 'shapes'
      },
      {
        stepNumber: 2,
        title: '2. Rounding Off Numbers & Roman Numerals',
        teacherSpeech: 'To round off to the nearest 1,000, look at the Hundreds digit. If it is 5 or more, round UP by adding 1 to the thousands digit. If less than 5, round DOWN. For Roman numerals, remember: I=1, V=5, X=10, L=50, C=100, D=500, M=1000!',
        boardText: 'ROUNDING OFF RULES & ROMAN NUMERALS\n\n• Rounding 4,862 to nearest 100:\n  Tens digit is 6 (>=5) -> Round UP to 4,900!\n\n• Rounding 5,420 to nearest 1,000:\n  Hundreds digit is 4 (<5) -> Round DOWN to 5,000!\n\n• Roman Numerals Key:\n  I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000\n  XC = 100 - 10 = 90\n  CD = 500 - 100 = 400',
        bulletPoints: [
          '5 or more -> Round UP',
          '4 or less -> Round DOWN',
          'Subtract when a smaller Roman numeral precedes a larger one (IV = 4, IX = 9)'
        ],
        equationOrHighlight: 'C = 100 | D = 500 | M = 1,000',
        diagramSvgType: 'shapes'
      }
    ],
    practiceProblems: [
      {
        id: 'p6-mat-p1',
        question: 'How many zeros are in the number One Billion when written in standard figures?',
        concreteContext: 'Count: 1,000,000,000.',
        options: ['6 zeros', '7 zeros', '8 zeros', '9 zeros'],
        correctIndex: 3,
        explanation: 'One Billion has 9 zeros: 1,000,000,000.',
        visualAidIcon: '🔢'
      },
      {
        id: 'p6-mat-p2',
        question: 'What is the Hindu-Arabic value of the Roman numeral MCMLX?',
        concreteContext: 'Break it down: M = 1000, CM = 900, LX = 60.',
        options: ['1960', '1940', '1860', '2060'],
        correctIndex: 0,
        explanation: 'M (1000) + CM (900) + LX (60) = 1960 (the year of Nigerian Independence!).',
        visualAidIcon: '🏛️'
      }
    ],
    assessmentQuestions: [
      {
        id: 'p6-mat-q1',
        question: 'Round off 78,542 to the nearest thousand.',
        contextNigerian: 'Look at the hundreds digit (5). Does 5 cause a round up or down?',
        options: ['78,000', '79,000', '78,500', '80,000'],
        correctAnswerIndex: 1,
        explanation: 'The hundreds digit is 5, so we round up 78,000 to 79,000.',
        hint: 'Whenever the deciding digit is 5 or more, round up.'
      },
      {
        id: 'p6-mat-q2',
        question: 'What is the Roman numeral for 450?',
        contextNigerian: '400 is CD (500 - 100) and 50 is L.',
        options: ['CCCCL', 'CDL', 'DCL', 'XDL'],
        correctAnswerIndex: 1,
        explanation: 'CD is 400 and L is 50, so 450 is CDL.',
        hint: 'Use subtraction principle for 400: C before D.'
      },
      {
        id: 'p6-mat-q3',
        question: 'A state government allocated ₦3,540,800,000 for building primary schools. What period is the digit 3 in?',
        contextNigerian: 'Count the digits from right to left: units, thousands, millions, billions.',
        options: ['Thousands period', 'Millions period', 'Billions period', 'Trillions period'],
        correctAnswerIndex: 2,
        explanation: 'The digit 3 is in the Billions period (3 Billion Naira).',
        hint: 'It is the 10th digit from the right.'
      }
    ]
  }
];

export const getLessonById = (id: string): LessonTopic | undefined => {
  if (!id) return undefined;
  const normalized = id.trim().replace(/_/g, '-');
  return NATIONAL_CURRICULUM_LESSONS.find(l => l.id.replace(/_/g, '-') === normalized);
};

export const CURRICULUM_DATA = NATIONAL_CURRICULUM_LESSONS;


