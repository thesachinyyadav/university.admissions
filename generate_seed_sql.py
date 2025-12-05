import csv
import datetime

def parse_date(date_str):
    try:
        return datetime.datetime.strptime(date_str, '%d/%m/%Y').strftime('%Y-%m-%d')
    except ValueError:
        return None

def parse_time(time_str):
    try:
        return datetime.datetime.strptime(time_str, '%I:%M %p').strftime('%H:%M:%S')
    except ValueError:
        return None

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + val.replace("'", "''") + "'"

input_file = 'level1 data.csv'
output_file = 'seed_applicants.sql'

print(f"Reading {input_file}...")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader) # Skip header
    
    # Map CSV columns to DB columns
    # CSV: Application No,Applicant Name,Mobile No,Applied Programme,Campus,Interview Date,Interview Time,Interview Venue,Next Check in Venue
    
    values_list = []
    seen_apps = set()
    
    for row in reader:
        if not row: continue
        
        app_no = row[0].strip()
        if not app_no or app_no in seen_apps:
            continue
        seen_apps.add(app_no)
        
        name = row[1].strip()
        phone = row[2].strip()
        program = row[3].strip()
        campus = row[4].strip()
        
        date_str = row[5].strip()
        time_str = row[6].strip()
        
        date_val = parse_date(date_str)
        time_val = parse_time(time_str)
        
        venue = row[7].strip()
        instructions = row[8].strip()
        
        # Construct value tuple
        # (application_number, name, phone, program, campus, date, time, location, instructions, status)
        
        val_str = f"({escape_sql(app_no)}, {escape_sql(name)}, {escape_sql(phone)}, {escape_sql(program)}, {escape_sql(campus)}, {escape_sql(date_val)}, {escape_sql(time_val)}, {escape_sql(venue)}, {escape_sql(instructions)}, 'REGISTERED')"
        values_list.append(val_str)

print(f"Found {len(values_list)} unique records.")

# Write to SQL file in batches
batch_size = 1000
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("-- Seed data for applicants table\n")
    
    for i in range(0, len(values_list), batch_size):
        batch = values_list[i:i+batch_size]
        sql = f"INSERT INTO applicants (application_number, name, phone, program, campus, date, time, location, instructions, status) VALUES \n"
        sql += ",\n".join(batch)
        sql += "\nON CONFLICT (application_number) DO UPDATE SET \n"
        sql += "name = EXCLUDED.name, phone = EXCLUDED.phone, program = EXCLUDED.program, campus = EXCLUDED.campus, date = EXCLUDED.date, time = EXCLUDED.time, location = EXCLUDED.location, instructions = EXCLUDED.instructions;\n\n"
        f.write(sql)

print(f"Written to {output_file}")
