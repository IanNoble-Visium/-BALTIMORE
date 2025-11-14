#!/usr/bin/env python3
"""
Baltimore Smart City Database Seeder
Parses CSV files and populates the PostgreSQL database
"""

import csv
from datetime import datetime
import os
import sys

# Database connection string from environment (.env -> DATABASE_URL)
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable is not set. Please configure it in your .env file.")
    sys.exit(1)

def parse_connection_string(url):
    """Parse PostgreSQL connection string"""
    # Remove postgresql:// prefix
    url = url.replace("postgresql://", "")
    
    # Split user:pass@host/db
    auth_host = url.split("@")
    user_pass = auth_host[0].split(":")
    host_db = auth_host[1].split("/")
    host = host_db[0].split("-pooler")[0] + "-pooler.us-east-1.aws.neon.tech"
    db_params = host_db[1].split("?")
    
    return {
        "user": user_pass[0],
        "password": user_pass[1],
        "host": host,
        "database": db_params[0],
        "port": 5432
    }

def connect_db():
    """Connect to PostgreSQL database"""
    import psycopg2
    
    conn_params = parse_connection_string(DATABASE_URL)
    
    conn = psycopg2.connect(
        host=conn_params["host"],
        database=conn_params["database"],
        user=conn_params["user"],
        password=conn_params["password"],
        port=conn_params["port"],
        sslmode="require"
    )
    
    return conn

def parse_datetime(date_str):
    """Parse various date formats"""
    if not date_str or date_str == "-" or date_str == "":
        return None
    
    formats = [
        "%m/%d/%Y %I:%M%p",
        "%d-%m-%Y %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y %H:%M",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None

def clean_value(value):
    """Clean CSV values"""
    if value in ["-", "", "N/A", "nan"]:
        return None
    return value.strip() if isinstance(value, str) else value

def determine_severity(alert_type):
    """Determine alert severity based on type"""
    severity_map = {
        "Power Loss": "high",
        "Sudden Tilt": "critical",
        "Low Voltage": "medium",
        "Without GPS Location": "low",
    }
    return severity_map.get(alert_type, "medium")

def seed_ubicquia_data(conn, csv_path):
    """Seed devices and alerts from Ubicquia CSV files"""
    cursor = conn.cursor()
    
    print(f"Processing {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        # Read header
        header_line = f.readline()
        headers = [h.strip() for h in header_line.split(',')]
        
        reader = csv.DictReader(f, fieldnames=headers)
        
        device_count = 0
        alert_count = 0
        
        for row in reader:
            try:
                # Extract device data
                device_id = clean_value(row.get('', '').split(',')[6] if len(row.get('', '').split(',')) > 6 else None)
                
                if not device_id:
                    continue
                
                # Parse row data (CSV has complex structure)
                parts = list(row.values())[0].split(',') if row else []
                
                if len(parts) < 20:
                    continue
                
                timestamp_str = clean_value(parts[1])
                alert_type = clean_value(parts[2])
                alert_value = clean_value(parts[3])
                burn_hours = clean_value(parts[5])
                device_id = clean_value(parts[6])
                firmware = clean_value(parts[14])
                install_date = clean_value(parts[17])
                latitude = clean_value(parts[18])
                light_status = clean_value(parts[19])
                longitude = clean_value(parts[20])
                network_type = clean_value(parts[22])
                node_name = clean_value(parts[23])
                node_status = clean_value(parts[24])
                utility = clean_value(parts[28])
                timezone = clean_value(parts[29])
                tags = clean_value(parts[31])
                
                # Insert or update device
                cursor.execute("""
                    INSERT INTO devices (
                        deviceId, nodeName, latitude, longitude, alertType, alertValue,
                        burnHours, lightStatus, nodeStatus, networkType, firmwareVersion,
                        installDate, utility, timezone, tags, lastUpdate
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (deviceId) DO UPDATE SET
                        nodeName = EXCLUDED.nodeName,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        alertType = EXCLUDED.alertType,
                        alertValue = EXCLUDED.alertValue,
                        burnHours = EXCLUDED.burnHours,
                        lightStatus = EXCLUDED.lightStatus,
                        nodeStatus = EXCLUDED.nodeStatus,
                        networkType = EXCLUDED.networkType,
                        firmwareVersion = EXCLUDED.firmwareVersion,
                        installDate = EXCLUDED.installDate,
                        utility = EXCLUDED.utility,
                        timezone = EXCLUDED.timezone,
                        tags = EXCLUDED.tags,
                        lastUpdate = NOW()
                """, (
                    device_id, node_name, latitude, longitude, alert_type, alert_value,
                    burn_hours, light_status, node_status, network_type, firmware,
                    install_date, utility, timezone, tags
                ))
                
                device_count += 1
                
                # Insert alert if there is an alert type
                if alert_type and alert_type not in ["Without GPS Location"]:
                    timestamp = parse_datetime(timestamp_str) or datetime.now()
                    severity = determine_severity(alert_type)
                    status = "active" if node_status in ["POWER LOSS", "OFFLINE"] else "resolved"
                    
                    cursor.execute("""
                        INSERT INTO alerts (
                            deviceId, timestamp, alertType, alertValue, severity, status,
                            latitude, longitude, description
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        device_id, timestamp, alert_type, alert_value, severity, status,
                        latitude, longitude, f"{alert_type} detected on {node_name or device_id}"
                    ))
                    
                    alert_count += 1
                
                if device_count % 100 == 0:
                    conn.commit()
                    print(f"  Processed {device_count} devices, {alert_count} alerts...")
                    
            except Exception as e:
                print(f"  Error processing row: {e}")
                continue
        
        conn.commit()
        print(f"  ✓ Completed: {device_count} devices, {alert_count} alerts")
        
    cursor.close()

def calculate_kpis(conn):
    """Calculate and insert KPI metrics"""
    cursor = conn.cursor()
    
    print("Calculating KPIs...")
    
    # Count devices by status
    cursor.execute("SELECT COUNT(*) FROM devices WHERE nodeStatus = 'ONLINE'")
    online_devices = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM devices WHERE nodeStatus IN ('OFFLINE', 'POWER LOSS')")
    offline_devices = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM devices")
    total_devices = cursor.fetchone()[0]
    
    # Count active alerts
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE status = 'active'")
    active_alerts = cursor.fetchone()[0]
    
    # Count alerts by type
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE alertType = 'Power Loss' AND status = 'active'")
    power_loss_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE alertType = 'Sudden Tilt' AND status = 'active'")
    tilt_alert_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE alertType = 'Low Voltage' AND status = 'active'")
    low_voltage_count = cursor.fetchone()[0]
    
    # Calculate device health score
    device_health_score = int((online_devices / total_devices * 100)) if total_devices > 0 else 0
    
    # Calculate feeder efficiency (mock calculation)
    feeder_efficiency = max(75, 100 - (active_alerts * 2))
    
    # Insert KPI record
    cursor.execute("""
        INSERT INTO kpis (
            timestamp, avgResolutionTime, feederEfficiency, networkStatusOnline,
            networkStatusOffline, activeAlertsCount, deviceHealthScore, totalDevices,
            onlineDevices, offlineDevices, powerLossCount, tiltAlertCount, lowVoltageCount
        ) VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        24, feeder_efficiency, online_devices, offline_devices, active_alerts,
        device_health_score, total_devices, online_devices, offline_devices,
        power_loss_count, tilt_alert_count, low_voltage_count
    ))
    
    conn.commit()
    cursor.close()
    
    print(f"  ✓ KPIs calculated: {total_devices} devices, {active_alerts} active alerts")

def main():
    """Main seeding function"""
    print("Baltimore Smart City Database Seeder")
    print("=" * 50)
    
    # Install psycopg2 if not available
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        os.system("pip3 install psycopg2-binary")
        import psycopg2
    
    # Connect to database
    print("\nConnecting to database...")
    conn = connect_db()
    print("  ✓ Connected")
    
    # Seed data from CSV files
    csv_files = [
        "/home/ubuntu/upload/ubicquia_adjusted_baltimore22.csv",
        "/home/ubuntu/upload/ubicquia_full_capabilities_baltimore.csv",
    ]
    
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            seed_ubicquia_data(conn, csv_file)
    
    # Calculate KPIs
    calculate_kpis(conn)
    
    # Close connection
    conn.close()
    
    print("\n" + "=" * 50)
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    main()
