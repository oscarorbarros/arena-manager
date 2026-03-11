import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({}, { status: 503 });

  try {
    const { data, error } = await supabase
      .from("config")
      .select("data")
      .eq("id", 2) // id=1 is football, id=2 is beach tennis
      .single();

    if (error) return NextResponse.json({});
    return NextResponse.json(data?.data ?? {});
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "No Supabase" }, { status: 503 });

  try {
    const body = await req.json();
    const { error } = await supabase
      .from("config")
      .upsert([{ id: 2, data: body }]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
