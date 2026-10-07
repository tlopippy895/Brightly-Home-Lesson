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
  }
];

export const getLessonById = (id: string): LessonTopic | undefined => {
  if (!id) return undefined;
  const normalized = id.trim().replace(/_/g, '-');
  return NATIONAL_CURRICULUM_LESSONS.find(l => l.id.replace(/_/g, '-') === normalized);
};

export const CURRICULUM_DATA = NATIONAL_CURRICULUM_LESSONS;


