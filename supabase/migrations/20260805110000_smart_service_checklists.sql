-- Checklist templates for Smart Service taxonomy expansions.

begin;

insert into public.service_checklist_templates (service_type, item_key, label, description, sort_order)
values
  ('move_in', 'rooms_ready', 'Rooms ready for move-in', 'Living spaces cleaned and ready for occupancy.', 10),
  ('move_in', 'bathrooms_ready', 'Bathrooms cleaned for move-in', 'Bathrooms cleaned to handover standard.', 20),
  ('move_in', 'kitchen_ready', 'Kitchen cleaned for move-in', 'Kitchen cleaned excluding add-ons not booked.', 30),
  ('move_in', 'floors_ready', 'Floors cleaned for move-in', 'Floors vacuumed/mopped for occupancy.', 40),

  ('move_out', 'rooms_cleared', 'Rooms cleaned for move-out', 'Living spaces cleaned for handover.', 10),
  ('move_out', 'bathrooms_cleared', 'Bathrooms cleaned for move-out', 'Bathrooms cleaned to handover standard.', 20),
  ('move_out', 'kitchen_cleared', 'Kitchen cleaned for move-out', 'Kitchen cleaned excluding add-ons not booked.', 30),
  ('move_out', 'floors_cleared', 'Floors cleaned for move-out', 'Floors vacuumed/mopped for handover.', 40),

  ('office', 'workstations_cleaned', 'Workstations cleaned', 'Desks and shared work surfaces wiped.', 10),
  ('office', 'communal_office', 'Communal office areas cleaned', 'Kitchens, meeting rooms and shared areas cleaned.', 20),
  ('office', 'office_floors', 'Office floors cleaned', 'Floors vacuumed/mopped as appropriate.', 30),

  ('retail_hospitality', 'front_of_house', 'Front-of-house cleaned', 'Customer-facing areas cleaned and presented.', 10),
  ('retail_hospitality', 'service_surfaces', 'Service surfaces cleaned', 'Counters and high-touch surfaces wiped.', 20),
  ('retail_hospitality', 'retail_floors', 'Floors cleaned', 'Floors vacuumed/mopped as appropriate.', 30),

  ('educational_facility', 'learning_spaces', 'Learning spaces cleaned', 'Classrooms or teaching areas cleaned.', 10),
  ('educational_facility', 'washrooms', 'Washrooms cleaned', 'Student/staff washrooms cleaned.', 20),
  ('educational_facility', 'education_floors', 'Floors cleaned', 'Floors vacuumed/mopped as appropriate.', 30),

  ('communal_area', 'entrances', 'Entrances and corridors cleaned', 'Shared entrances, corridors and landings cleaned.', 10),
  ('communal_area', 'lifts_stairs', 'Lifts/stairs cleaned', 'Shared circulation areas cleaned where applicable.', 20),
  ('communal_area', 'communal_floors', 'Communal floors cleaned', 'Shared floors vacuumed/mopped as appropriate.', 30),

  ('holiday_let', 'guest_ready', 'Guest-ready reset completed', 'Property reset for incoming guests.', 10),
  ('holiday_let', 'guest_surfaces', 'Guest surfaces cleaned', 'Visible guest-facing surfaces cleaned.', 20),
  ('holiday_let', 'holiday_floors', 'Floors cleaned', 'Floors vacuumed/mopped as appropriate.', 30),

  ('serviced_accommodation', 'unit_reset', 'Unit reset completed', 'Serviced unit reset for incoming guests.', 10),
  ('serviced_accommodation', 'guest_surfaces', 'Guest surfaces cleaned', 'Visible guest-facing surfaces cleaned.', 20),
  ('serviced_accommodation', 'serviced_floors', 'Floors cleaned', 'Floors vacuumed/mopped as appropriate.', 30),

  ('window_cleaning', 'glass_cleaned', 'Window glass cleaned', 'Agreed window glass cleaned.', 10),
  ('window_cleaning', 'frames_sills', 'Frames and sills wiped', 'Accessible frames and sills wiped where included.', 20),

  ('pregnancy_support', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces cleaned with supportive care.', 10),
  ('pregnancy_support', 'bathrooms_support', 'Bathrooms cleaned', 'Bathrooms cleaned with attention to comfort and safety.', 20),
  ('pregnancy_support', 'kitchen_support', 'Kitchen surfaces cleaned', 'Kitchen surfaces wiped excluding add-ons not booked.', 30),

  ('postpartum', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces cleaned to comprehensive standard.', 10),
  ('postpartum', 'bathrooms_support', 'Bathrooms detailed', 'Bathrooms cleaned with extra care.', 20),
  ('postpartum', 'kitchen_support', 'Kitchen detailed', 'Kitchen cleaned excluding add-ons not booked.', 30),
  ('postpartum', 'floors_support', 'Floors cleaned', 'Floors vacuumed/mopped thoroughly.', 40),

  ('illness_recovery', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces cleaned for recovery support.', 10),
  ('illness_recovery', 'bathrooms_support', 'Bathrooms detailed', 'Bathrooms cleaned with hygiene focus.', 20),
  ('illness_recovery', 'kitchen_support', 'Kitchen surfaces cleaned', 'Kitchen surfaces wiped excluding add-ons not booked.', 30),
  ('illness_recovery', 'floors_support', 'Floors cleaned', 'Floors vacuumed/mopped thoroughly.', 40),

  ('post_injury', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces cleaned for limited-mobility support.', 10),
  ('post_injury', 'bathrooms_support', 'Bathrooms detailed', 'Bathrooms cleaned with safety and access in mind.', 20),
  ('post_injury', 'kitchen_support', 'Kitchen surfaces cleaned', 'Kitchen surfaces wiped excluding add-ons not booked.', 30),
  ('post_injury', 'floors_support', 'Floors cleaned', 'Floors vacuumed/mopped thoroughly.', 40),

  ('hospital_discharge', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces prepared for return home.', 10),
  ('hospital_discharge', 'bathrooms_support', 'Bathrooms detailed', 'Bathrooms cleaned to comprehensive standard.', 20),
  ('hospital_discharge', 'kitchen_support', 'Kitchen detailed', 'Kitchen cleaned excluding add-ons not booked.', 30),
  ('hospital_discharge', 'floors_support', 'Floors cleaned', 'Floors vacuumed/mopped thoroughly.', 40),

  ('bereavement_support', 'priority_rooms', 'Priority rooms cleaned', 'Agreed living spaces cleaned respectfully.', 10),
  ('bereavement_support', 'bathrooms_support', 'Bathrooms cleaned', 'Bathrooms cleaned with care.', 20),
  ('bereavement_support', 'kitchen_support', 'Kitchen surfaces cleaned', 'Kitchen surfaces wiped excluding add-ons not booked.', 30)
on conflict (service_type, item_key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

commit;
