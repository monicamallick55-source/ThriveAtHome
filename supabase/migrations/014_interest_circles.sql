-- Add interest_tag column to cultural_circles for interest-based matching
ALTER TABLE cultural_circles ADD COLUMN IF NOT EXISTS interest_tag text;

-- Seed 8 interest-based community circles
INSERT INTO cultural_circles (circle_name, primary_language, description, interest_tag) VALUES
('Gardening & Nature Club', 'english', 'Swap tips, celebrate harvests, and share the joy of growing things — whether in a backyard garden, a balcony planter, or a sunny windowsill.', 'Gardening'),
('Books & Storytelling Circle', 'english', 'A cozy gathering for book lovers and storytellers. Share what you''re reading, swap recommendations, and enjoy the magic of a good story.', 'Books'),
('Music Lovers Circle', 'english', 'From big band to blues to classical — a welcoming circle for everyone who loves music, singing along, or simply listening together.', 'Music'),
('Cooking & Recipes Circle', 'english', 'Share cherished family recipes, cooking memories, and kitchen tips passed down through generations. Every dish tells a story.', 'Cooking'),
('Faith & Spirituality Circle', 'english', 'A respectful and welcoming space for seniors of all faith backgrounds to share reflections, prayers, and spiritual support.', 'Faith & spirituality'),
('Sports & Games Circle', 'english', 'For sports fans, card players, chess enthusiasts, and everyone who loves a good game — come play, cheer, and reminisce.', 'Sports'),
('Travel Memories Circle', 'english', 'Relive your favourite journeys and dream of future adventures. Share photos, stories, and the travels that shaped your life.', 'Travel memories'),
('Crafts & Creative Arts Circle', 'english', 'Knitters, painters, quilters, woodworkers, and makers of all kinds — share your creative projects, get ideas, and inspire each other.', 'Family');
