import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// 1. Initialize the Database Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "TasksTable";

export const handler = async (event) => {
    // 2. "Identify" the request from API Gateway
    const method = event.httpMethod;
    const path = event.resource;
    const id = event.pathParameters?.id;

    try {
        // --- ROUTE 1: Create Task (POST /tasks) ---
        if (method === 'POST' && path === '/tasks') {
            const body = JSON.parse(event.body);
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: { 
                    task_id: body.task_id, 
                    user_id: body.user_id, 
                    task_name: body.task_name, 
                    status: "pending" 
                }
            }));
            return { statusCode: 201, body: JSON.stringify({ message: "Task successfully saved!" }) };
        }

        // --- ROUTE 2: Get All Tasks (GET /tasks) ---
        if (method === 'GET' && path === '/tasks') {
            const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
            return { statusCode: 200, body: JSON.stringify(result.Items) };
        }

        // --- ROUTE 3: Delete Task (DELETE /tasks/{id}) ---
        if (method === 'DELETE' && id) {
            await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { task_id: id } }));
            return { statusCode: 200, body: JSON.stringify({ message: `Task ${id} deleted.` }) };
        }

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};