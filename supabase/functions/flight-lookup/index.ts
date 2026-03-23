const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightNumber, date } = await req.json();

    if (!flightNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Flight number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('AVIATIONSTACK_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AVIATIONSTACK_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse airline code and flight number (e.g., "DL5925" → iata "DL", number "5925")
    const cleaned = flightNumber.replace(/\s+/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]{2})(\d+)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid flight number format. Use e.g., DL5925 or BA283' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const airlineIata = match[1];
    const flightNum = match[2];

    // AviationStack API call
    const params = new URLSearchParams({
      access_key: apiKey,
      airline_iata: airlineIata,
      flight_number: flightNum,
    });

    // Add date filter if provided
    if (date) {
      params.set('flight_date', date);
    }

    console.log(`Looking up flight ${airlineIata}${flightNum}`, date ? `on ${date}` : '');

    const response = await fetch(`http://api.aviationstack.com/v1/flights?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      console.error('AviationStack error:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error.message || 'API error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.data || data.data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Flight not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Take the first result
    const flight = data.data[0];

    const result = {
      success: true,
      flight: {
        airline: flight.airline?.name || airlineIata,
        flightNumber: `${airlineIata}${flightNum}`,
        departureAirport: flight.departure?.airport || '',
        departureIata: flight.departure?.iata || '',
        departureTime: flight.departure?.scheduled || '',
        departureTimezone: flight.departure?.timezone || '',
        arrivalAirport: flight.arrival?.airport || '',
        arrivalIata: flight.arrival?.iata || '',
        arrivalTime: flight.arrival?.scheduled || '',
        arrivalTimezone: flight.arrival?.timezone || '',
        status: flight.flight_status || '',
      },
    };

    console.log('Flight found:', result.flight.departureIata, '→', result.flight.arrivalIata);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error looking up flight:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to look up flight';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
