"""Shared benchmark of multi-step reasoning problems (read-only).

Each entry: (question, accepted_answers). Answers matched case-insensitively
as whole tokens, commas/$ stripped. Deliberately multi-step so that getting
the answer right benefits from reasoning, while the tight token budget makes
*how* you reason matter.
"""

PROBLEMS = [
    ("A train leaves at 2:45 PM and arrives at 6:10 PM. How many minutes was the trip?", ["205"]),
    ("A store raises an $80 item by 25%, then takes 20% off the new price. Final price in dollars?", ["80"]),
    ("If 3 painters paint 3 fences in 3 hours, how many hours do 9 painters need for 9 fences?", ["3"]),
    ("5 red, 7 blue, 4 green socks in a drawer. In the dark, how many must I pull to guarantee a matching pair?", ["4"]),
    ("A snail climbs 3 m by day, slips 2 m by night, in a 10 m well. On which day does it reach the top?", ["8"]),
    ("Next number in the sequence 2, 6, 12, 20, 30, ...?", ["42"]),
    ("Sarah is twice her brother's age. In 5 years she will be 1.5x his age. How old is Sarah now?", ["10"]),
    ("A rectangle has perimeter 24 cm; length is twice the width. Area in square cm?", ["32"]),
    ("If today is Wednesday, what day will it be in 100 days?", ["friday"]),
    ("A bat and a ball cost $1.10 together; the bat costs $1.00 more than the ball. Ball cost in cents?", ["5"]),
    ("How many times do a clock's hour and minute hands overlap in 24 hours?", ["22"]),
    ("Three friends split a bill equally. If the bill were $12 more, each pays $4 more. How many friends?", ["3"]),
    ("A cube painted on all 6 faces is cut into 27 equal cubes. How many small cubes have exactly two painted faces?", ["12"]),
    ("A car goes 60 km at 30 km/h, then 60 km at 60 km/h. Average speed for the whole trip in km/h?", ["40"]),
    ("In a race, you overtake the person in 2nd place. What place are you in now?", ["2"]),
    ("A clock chimes 6 times in 5 seconds (at the strokes). How many seconds to chime 12 times?", ["11"]),
    ("Two trains 300 km apart approach at 40 and 60 km/h. After how many hours do they meet?", ["3"]),
    ("A shirt is discounted 30%, then 30% again. What single percent discount is equivalent?", ["51"]),
    ("If 5 machines make 5 widgets in 5 minutes, how many minutes for 100 machines to make 100 widgets?", ["5"]),
    ("You have coins worth 1, 5, 10, 25 cents. Fewest coins to make 63 cents?", ["6"]),
]
