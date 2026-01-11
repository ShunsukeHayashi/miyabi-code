"""
Miyabi Data Warehouse - Connection Health Check DAG
Version: 1.0.0

Validates database connections before ETL processes run.
Run every 15 minutes to detect connection issues early.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.exceptions import AirflowFailException
import logging

logger = logging.getLogger(__name__)

default_args = {
    'owner': 'miyabi',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=1),
}

def check_source_db_connection(**context):
    """Test connection to Miyabi source database."""
    try:
        hook = PostgresHook(postgres_conn_id='miyabi_source_db')
        conn = hook.get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result and result[0] == 1:
            logger.info('✅ Source DB connection successful')
            return True
        else:
            raise AirflowFailException('Source DB returned unexpected result')
            
    except Exception as e:
        logger.error(f'❌ Source DB connection failed: {str(e)}')
        raise AirflowFailException(f'Source DB connection failed: {str(e)}')

def check_dw_connection(**context):
    """Test connection to Data Warehouse."""
    try:
        hook = PostgresHook(postgres_conn_id='miyabi_dw')
        conn = hook.get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result and result[0] == 1:
            logger.info('✅ Data Warehouse connection successful')
            return True
        else:
            raise AirflowFailException('DW returned unexpected result')
            
    except Exception as e:
        logger.error(f'❌ Data Warehouse connection failed: {str(e)}')
        raise AirflowFailException(f'Data Warehouse connection failed: {str(e)}')

def check_dimension_tables(**context):
    """Verify dimension tables exist in DW."""
    expected_tables = [
        'dim_time',
        'dim_issue', 
        'dim_agent',
        'dim_infrastructure',
        'dim_label',
        'dim_worktree'
    ]
    
    try:
        hook = PostgresHook(postgres_conn_id='miyabi_dw')
        conn = hook.get_conn()
        cursor = conn.cursor()
        
        missing_tables = []
        for table in expected_tables:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = '{table}'
                )
            """)
            exists = cursor.fetchone()[0]
            if not exists:
                missing_tables.append(table)
                
        cursor.close()
        conn.close()
        
        if missing_tables:
            logger.warning(f'⚠️ Missing dimension tables: {missing_tables}')
            # Don't fail - tables might be created by init script
            return {'missing_tables': missing_tables}
        else:
            logger.info('✅ All dimension tables exist')
            return {'missing_tables': []}
            
    except Exception as e:
        logger.error(f'❌ Dimension table check failed: {str(e)}')
        raise AirflowFailException(f'Dimension table check failed: {str(e)}')

with DAG(
    'connection_health_check',
    default_args=default_args,
    description='Validate database connections and schema',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['health', 'monitoring', 'miyabi'],
) as dag:
    
    check_source = PythonOperator(
        task_id='check_source_db',
        python_callable=check_source_db_connection,
        provide_context=True,
    )
    
    check_dw = PythonOperator(
        task_id='check_data_warehouse',
        python_callable=check_dw_connection,
        provide_context=True,
    )
    
    check_dims = PythonOperator(
        task_id='check_dimension_tables',
        python_callable=check_dimension_tables,
        provide_context=True,
    )
    
    # Run checks in parallel for faster validation
    [check_source, check_dw] >> check_dims
