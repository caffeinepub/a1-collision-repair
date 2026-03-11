import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Int64 "mo:core/Int64";

actor {

  // ==================== AUTH ====================
  var sharedPassword : Text = "A1shop2024";

  public func verifyPassword(password : Text) : async Bool {
    password == sharedPassword
  };

  public func changePassword(oldPassword : Text, newPassword : Text) : async Bool {
    if (oldPassword == sharedPassword) {
      sharedPassword := newPassword;
      true
    } else {
      false
    }
  };

  // ==================== TYPES ====================
  public type JobType = { #Collision; #Paint; #Rust; #Glass; #Mechanical };
  public type WorkOrderStatus = { #Estimate; #InProgress; #Ready; #Delivered; #OnHold };
  public type PartStatus = { #NeedToOrder; #Ordered; #Arrived };
  public type Supplier = { #LKQ; #Keystone; #PartsGeek; #AutoZone; #NAPA; #Dealer; #Other };

  public type WorkOrder = {
    id : Text;
    customerName : Text;
    phone : Text;
    vehicle : Text;
    vin : Text;
    color : Text;
    jobType : JobType;
    status : WorkOrderStatus;
    chargeToCustomer : Float;
    laborCost : Float;
    technicianName : Text;
    dateIn : Text;
    dateDelivered : Text;
    notes : Text;
    approvalPrintedName : Text;
    approvalSignatureData : Text;
    approvalDate : Text;
  };

  public type WorkOrderInput = {
    customerName : Text;
    phone : Text;
    vehicle : Text;
    vin : Text;
    color : Text;
    jobType : JobType;
    status : WorkOrderStatus;
    chargeToCustomer : Float;
    laborCost : Float;
    technicianName : Text;
    dateIn : Text;
    dateDelivered : Text;
    notes : Text;
    approvalPrintedName : Text;
    approvalSignatureData : Text;
    approvalDate : Text;
  };

  public type Part = {
    id : Text;
    workOrderId : Text;
    partName : Text;
    partNumber : Text;
    supplier : Supplier;
    cost : Float;
    quantity : Nat;
    status : PartStatus;
    orderedDate : Text;
    arrivedDate : Text;
    notes : Text;
  };

  public type PartInput = {
    workOrderId : Text;
    partName : Text;
    partNumber : Text;
    supplier : Supplier;
    cost : Float;
    quantity : Nat;
    status : PartStatus;
    orderedDate : Text;
    arrivedDate : Text;
    notes : Text;
  };

  public type DashboardStats = {
    activeJobs : Nat;
    inProgress : Nat;
    readyToDeliver : Nat;
    partsToOrder : Nat;
  };

  public type JobTypeCounts = {
    collision : Nat;
    paint : Nat;
    rust : Nat;
    glass : Nat;
    mechanical : Nat;
  };

  public type PartsStatusCounts = {
    needToOrder : Nat;
    ordered : Nat;
    arrived : Nat;
  };

  public type MonthlySummary = {
    revenue : Float;
    partsCost : Float;
    laborCost : Float;
    netProfit : Float;
  };

  public type WorkOrderWithFinancials = {
    workOrder : WorkOrder;
    partsCost : Float;
    netProfit : Float;
    parts : [Part];
  };

  // ==================== STORAGE ====================
  var workOrders = Map.empty<Text, WorkOrder>();
  var parts = Map.empty<Text, Part>();
  var woCounter : Nat = 0;
  var partCounter : Nat = 0;

  // ==================== HELPERS ====================
  func natToFloat(n : Nat) : Float {
    Float.fromInt64(Int64.fromNat64(Nat64.fromNat(n)))
  };

  func nextWoId() : Text {
    woCounter += 1;
    let n = woCounter;
    if (n < 10) { "WO-000" # n.toText() }
    else if (n < 100) { "WO-00" # n.toText() }
    else if (n < 1000) { "WO-0" # n.toText() }
    else { "WO-" # n.toText() }
  };

  func nextPartId() : Text {
    partCounter += 1;
    "PT-" # partCounter.toText()
  };

  func calcPartsCost(workOrderId : Text) : Float {
    var total : Float = 0.0;
    for ((_, p) in parts.entries()) {
      if (p.workOrderId == workOrderId) {
        total += p.cost * natToFloat(p.quantity);
      };
    };
    total
  };

  func getMonthFromDate(dateStr : Text) : (Nat, Nat) {
    if (dateStr.size() < 7) return (0, 0);
    let chars = dateStr.toIter().toArray();
    var yearStr = "";
    var monthStr = "";
    var i = 0;
    while (i < 4) { yearStr #= Text.fromChar(chars[i]); i += 1; };
    i := 5;
    while (i < 7) { monthStr #= Text.fromChar(chars[i]); i += 1; };
    let year = switch (Nat.fromText(yearStr)) { case (?n) n; case null 0 };
    let month = switch (Nat.fromText(monthStr)) { case (?n) n; case null 0 };
    (month, year)
  };

  // ==================== WORK ORDERS ====================
  public func createWorkOrder(input : WorkOrderInput) : async WorkOrder {
    let id = nextWoId();
    let wo : WorkOrder = {
      id;
      customerName = input.customerName;
      phone = input.phone;
      vehicle = input.vehicle;
      vin = input.vin;
      color = input.color;
      jobType = input.jobType;
      status = input.status;
      chargeToCustomer = input.chargeToCustomer;
      laborCost = input.laborCost;
      technicianName = input.technicianName;
      dateIn = input.dateIn;
      dateDelivered = input.dateDelivered;
      notes = input.notes;
      approvalPrintedName = input.approvalPrintedName;
      approvalSignatureData = input.approvalSignatureData;
      approvalDate = input.approvalDate;
    };
    workOrders.add(id, wo);
    wo
  };

  public func updateWorkOrder(id : Text, input : WorkOrderInput) : async ?WorkOrder {
    switch (workOrders.get(id)) {
      case null null;
      case (?_) {
        let wo : WorkOrder = {
          id;
          customerName = input.customerName;
          phone = input.phone;
          vehicle = input.vehicle;
          vin = input.vin;
          color = input.color;
          jobType = input.jobType;
          status = input.status;
          chargeToCustomer = input.chargeToCustomer;
          laborCost = input.laborCost;
          technicianName = input.technicianName;
          dateIn = input.dateIn;
          dateDelivered = input.dateDelivered;
          notes = input.notes;
          approvalPrintedName = input.approvalPrintedName;
          approvalSignatureData = input.approvalSignatureData;
          approvalDate = input.approvalDate;
        };
        workOrders.add(id, wo);
        ?wo
      };
    }
  };

  public func deleteWorkOrder(id : Text) : async Bool {
    switch (workOrders.get(id)) {
      case null false;
      case (?_) { workOrders.remove(id); true };
    }
  };

  public query func getWorkOrder(id : Text) : async ?WorkOrder {
    workOrders.get(id)
  };

  public query func getAllWorkOrders() : async [WorkOrder] {
    workOrders.values().toArray()
  };

  public query func getWorkOrdersByStatus(status : WorkOrderStatus) : async [WorkOrder] {
    workOrders.values().toArray().filter(func(wo : WorkOrder) : Bool {
      switch (status, wo.status) {
        case (#Estimate, #Estimate) true;
        case (#InProgress, #InProgress) true;
        case (#Ready, #Ready) true;
        case (#Delivered, #Delivered) true;
        case (#OnHold, #OnHold) true;
        case _ false;
      }
    })
  };

  public query func getRecentWorkOrders(limit : Nat) : async [WorkOrder] {
    let all = workOrders.values().toArray();
    let sorted = all.sort(func(a : WorkOrder, b : WorkOrder) : { #less; #equal; #greater } {
      if (a.dateIn > b.dateIn) #less
      else if (a.dateIn < b.dateIn) #greater
      else #equal
    });
    if (sorted.size() <= limit) sorted
    else Array.tabulate(limit, func(i : Nat) : WorkOrder { sorted[i] })
  };

  public query func getWorkOrdersByMonth(month : Nat, year : Nat) : async [WorkOrder] {
    workOrders.values().toArray().filter(func(wo : WorkOrder) : Bool {
      if (wo.status != #Delivered) return false;
      let (m, y) = getMonthFromDate(wo.dateDelivered);
      m == month and y == year
    })
  };

  // ==================== PARTS ====================
  public func createPart(input : PartInput) : async Part {
    let id = nextPartId();
    let p : Part = {
      id;
      workOrderId = input.workOrderId;
      partName = input.partName;
      partNumber = input.partNumber;
      supplier = input.supplier;
      cost = input.cost;
      quantity = input.quantity;
      status = input.status;
      orderedDate = input.orderedDate;
      arrivedDate = input.arrivedDate;
      notes = input.notes;
    };
    parts.add(id, p);
    p
  };

  public func updatePart(id : Text, input : PartInput) : async ?Part {
    switch (parts.get(id)) {
      case null null;
      case (?_) {
        let p : Part = {
          id;
          workOrderId = input.workOrderId;
          partName = input.partName;
          partNumber = input.partNumber;
          supplier = input.supplier;
          cost = input.cost;
          quantity = input.quantity;
          status = input.status;
          orderedDate = input.orderedDate;
          arrivedDate = input.arrivedDate;
          notes = input.notes;
        };
        parts.add(id, p);
        ?p
      };
    }
  };

  public func deletePart(id : Text) : async Bool {
    switch (parts.get(id)) {
      case null false;
      case (?_) { parts.remove(id); true };
    }
  };

  public query func getPart(id : Text) : async ?Part {
    parts.get(id)
  };

  public query func getPartsByWorkOrder(workOrderId : Text) : async [Part] {
    parts.values().toArray().filter(func(p : Part) : Bool { p.workOrderId == workOrderId })
  };

  public query func getAllParts() : async [Part] {
    parts.values().toArray()
  };

  public func advancePartStatus(id : Text) : async ?Part {
    switch (parts.get(id)) {
      case null null;
      case (?p) {
        let newStatus : PartStatus = switch (p.status) {
          case (#NeedToOrder) #Ordered;
          case (#Ordered) #Arrived;
          case (#Arrived) #Arrived;
        };
        let updated : Part = {
          id = p.id;
          workOrderId = p.workOrderId;
          partName = p.partName;
          partNumber = p.partNumber;
          supplier = p.supplier;
          cost = p.cost;
          quantity = p.quantity;
          status = newStatus;
          orderedDate = p.orderedDate;
          arrivedDate = p.arrivedDate;
          notes = p.notes;
        };
        parts.add(id, updated);
        ?updated
      };
    }
  };

  // ==================== STATS ====================
  public query func getDashboardStats() : async DashboardStats {
    var active = 0;
    var inProg = 0;
    var ready = 0;
    for ((_, wo) in workOrders.entries()) {
      switch (wo.status) {
        case (#Estimate or #InProgress or #Ready or #OnHold) { active += 1; };
        case (#Delivered) {};
      };
      switch (wo.status) {
        case (#InProgress) { inProg += 1; };
        case _ {};
      };
      switch (wo.status) {
        case (#Ready) { ready += 1; };
        case _ {};
      };
    };
    var partsToOrd = 0;
    for ((_, p) in parts.entries()) {
      switch (p.status) {
        case (#NeedToOrder) { partsToOrd += 1; };
        case _ {};
      };
    };
    { activeJobs = active; inProgress = inProg; readyToDeliver = ready; partsToOrder = partsToOrd }
  };

  public query func getJobsByType() : async JobTypeCounts {
    var collision = 0; var paint = 0; var rust = 0; var glass = 0; var mechanical = 0;
    for ((_, wo) in workOrders.entries()) {
      switch (wo.jobType) {
        case (#Collision) { collision += 1; };
        case (#Paint) { paint += 1; };
        case (#Rust) { rust += 1; };
        case (#Glass) { glass += 1; };
        case (#Mechanical) { mechanical += 1; };
      };
    };
    { collision; paint; rust; glass; mechanical }
  };

  public query func getPartsStatusCounts() : async PartsStatusCounts {
    var needToOrder = 0; var ordered = 0; var arrived = 0;
    for ((_, p) in parts.entries()) {
      switch (p.status) {
        case (#NeedToOrder) { needToOrder += 1; };
        case (#Ordered) { ordered += 1; };
        case (#Arrived) { arrived += 1; };
      };
    };
    { needToOrder; ordered; arrived }
  };

  public query func getMonthlyProfitSummary(month : Nat, year : Nat) : async MonthlySummary {
    var revenue : Float = 0.0;
    var pCost : Float = 0.0;
    var lCost : Float = 0.0;
    for ((_, wo) in workOrders.entries()) {
      if (wo.status == #Delivered) {
        let (m, y) = getMonthFromDate(wo.dateDelivered);
        if (m == month and y == year) {
          revenue += wo.chargeToCustomer;
          lCost += wo.laborCost;
          pCost += calcPartsCost(wo.id);
        };
      };
    };
    { revenue; partsCost = pCost; laborCost = lCost; netProfit = revenue - pCost - lCost }
  };

  public query func getWorkOrderWithFinancials(id : Text) : async ?WorkOrderWithFinancials {
    switch (workOrders.get(id)) {
      case null null;
      case (?wo) {
        let filteredParts = parts.values().toArray().filter(func(p : Part) : Bool { p.workOrderId == id });
        let pCost = calcPartsCost(id);
        let netProfit = wo.chargeToCustomer - pCost - wo.laborCost;
        ?{ workOrder = wo; partsCost = pCost; netProfit; parts = filteredParts }
      };
    }
  };

  // ==================== SEED DATA ====================
  func seedData() : () {
    let seedWOs : [(Text, WorkOrder)] = [
      ("WO-0001", { id = "WO-0001"; customerName = "Mike Johnson"; phone = "850-555-0101"; vehicle = "2020 Toyota Camry"; vin = "1HGCV1F3XLA000001"; color = "Silver"; jobType = #Collision; status = #InProgress; chargeToCustomer = 3200.0; laborCost = 800.0; technicianName = "Jake Torres"; dateIn = "2026-02-18"; dateDelivered = ""; notes = "Front bumper and hood damage."; approvalPrintedName = "Mike Johnson"; approvalSignatureData = ""; approvalDate = "2026-02-18" }),
      ("WO-0002", { id = "WO-0002"; customerName = "Sandra Lee"; phone = "850-555-0202"; vehicle = "2018 Ford F-150"; vin = "1FTEW1EP5JFA00002"; color = "Blue"; jobType = #Paint; status = #Ready; chargeToCustomer = 1800.0; laborCost = 600.0; technicianName = "Carlos Ruiz"; dateIn = "2026-02-20"; dateDelivered = ""; notes = "Full respray, color match."; approvalPrintedName = "Sandra Lee"; approvalSignatureData = ""; approvalDate = "2026-02-20" }),
      ("WO-0003", { id = "WO-0003"; customerName = "Derek Hill"; phone = "850-555-0303"; vehicle = "2015 Chevrolet Silverado"; vin = "3GCUKREC5FG000003"; color = "Black"; jobType = #Rust; status = #Estimate; chargeToCustomer = 950.0; laborCost = 300.0; technicianName = "Jake Torres"; dateIn = "2026-03-01"; dateDelivered = ""; notes = "Rust on rocker panels."; approvalPrintedName = ""; approvalSignatureData = ""; approvalDate = "" }),
      ("WO-0004", { id = "WO-0004"; customerName = "Brenda Carter"; phone = "850-555-0404"; vehicle = "2022 Honda Accord"; vin = "1HGCV1F3XNA000004"; color = "White"; jobType = #Glass; status = #Delivered; chargeToCustomer = 450.0; laborCost = 120.0; technicianName = "Maria Vega"; dateIn = "2026-02-10"; dateDelivered = "2026-02-14"; notes = "Windshield replacement."; approvalPrintedName = "Brenda Carter"; approvalSignatureData = ""; approvalDate = "2026-02-10" }),
      ("WO-0005", { id = "WO-0005"; customerName = "Tom Williams"; phone = "850-555-0505"; vehicle = "2019 Jeep Wrangler"; vin = "1C4HJXEG5KW000005"; color = "Red"; jobType = #Mechanical; status = #InProgress; chargeToCustomer = 2100.0; laborCost = 700.0; technicianName = "Carlos Ruiz"; dateIn = "2026-02-25"; dateDelivered = ""; notes = "Engine mounts and suspension."; approvalPrintedName = "Tom Williams"; approvalSignatureData = ""; approvalDate = "2026-02-25" }),
      ("WO-0006", { id = "WO-0006"; customerName = "Lisa Nguyen"; phone = "850-555-0606"; vehicle = "2021 Nissan Altima"; vin = "1N4BL4BV5MN000006"; color = "Gray"; jobType = #Collision; status = #Delivered; chargeToCustomer = 4100.0; laborCost = 1100.0; technicianName = "Jake Torres"; dateIn = "2026-01-15"; dateDelivered = "2026-01-28"; notes = "Driver side door and quarter panel."; approvalPrintedName = "Lisa Nguyen"; approvalSignatureData = ""; approvalDate = "2026-01-15" }),
      ("WO-0007", { id = "WO-0007"; customerName = "Ray Thompson"; phone = "850-555-0707"; vehicle = "2017 Dodge Charger"; vin = "2C3CDXAT8HH000007"; color = "Charcoal"; jobType = #Paint; status = #OnHold; chargeToCustomer = 2600.0; laborCost = 750.0; technicianName = "Maria Vega"; dateIn = "2026-03-02"; dateDelivered = ""; notes = "Waiting on customer approval."; approvalPrintedName = ""; approvalSignatureData = ""; approvalDate = "" }),
      ("WO-0008", { id = "WO-0008"; customerName = "Paula Grant"; phone = "850-555-0808"; vehicle = "2023 Kia Sportage"; vin = "KNDPMCAC9P7000008"; color = "Orange"; jobType = #Collision; status = #Delivered; chargeToCustomer = 5500.0; laborCost = 1400.0; technicianName = "Carlos Ruiz"; dateIn = "2026-02-01"; dateDelivered = "2026-02-20"; notes = "Major front-end collision."; approvalPrintedName = "Paula Grant"; approvalSignatureData = ""; approvalDate = "2026-02-01" })
    ];
    for ((sid, wo) in seedWOs.vals()) {
      workOrders.add(sid, wo);
    };
    woCounter := 8;

    let seedParts : [(Text, Part)] = [
      ("PT-1",  { id = "PT-1";  workOrderId = "WO-0001"; partName = "Front Bumper Cover";     partNumber = "521190C040";   supplier = #LKQ;       cost = 285.0; quantity = 1; status = #Ordered;     orderedDate = "2026-02-19"; arrivedDate = "";           notes = "" }),
      ("PT-2",  { id = "PT-2";  workOrderId = "WO-0001"; partName = "Hood Assembly";         partNumber = "53301-06230";  supplier = #Keystone;  cost = 620.0; quantity = 1; status = #Arrived;     orderedDate = "2026-02-19"; arrivedDate = "2026-02-22"; notes = "" }),
      ("PT-3",  { id = "PT-3";  workOrderId = "WO-0001"; partName = "Headlight Assembly LH"; partNumber = "81150-0E190";  supplier = #Dealer;    cost = 390.0; quantity = 1; status = #NeedToOrder; orderedDate = "";           arrivedDate = "";           notes = "OEM required" }),
      ("PT-4",  { id = "PT-4";  workOrderId = "WO-0002"; partName = "Clear Coat Gallon";     partNumber = "CC-4500";      supplier = #AutoZone;  cost = 110.0; quantity = 2; status = #Arrived;     orderedDate = "2026-02-21"; arrivedDate = "2026-02-23"; notes = "" }),
      ("PT-5",  { id = "PT-5";  workOrderId = "WO-0005"; partName = "Engine Mount Kit";      partNumber = "EM-WK-001";    supplier = #NAPA;      cost = 145.0; quantity = 1; status = #Ordered;     orderedDate = "2026-02-26"; arrivedDate = "";           notes = "" }),
      ("PT-6",  { id = "PT-6";  workOrderId = "WO-0005"; partName = "Front CV Axle";        partNumber = "CV-JK-RH";     supplier = #PartsGeek; cost = 220.0; quantity = 1; status = #NeedToOrder; orderedDate = "";           arrivedDate = "";           notes = "" }),
      ("PT-7",  { id = "PT-7";  workOrderId = "WO-0007"; partName = "Base Coat Custom Mix"; partNumber = "BC-CUSTOM-01";  supplier = #Other;     cost = 340.0; quantity = 1; status = #NeedToOrder; orderedDate = "";           arrivedDate = "";           notes = "Waiting on color formula" }),
      ("PT-8",  { id = "PT-8";  workOrderId = "WO-0003"; partName = "Rocker Panel LH";      partNumber = "RP-K15-LH";    supplier = #LKQ;       cost = 175.0; quantity = 1; status = #NeedToOrder; orderedDate = "";           arrivedDate = "";           notes = "" }),
      ("PT-9",  { id = "PT-9";  workOrderId = "WO-0008"; partName = "Front Bumper Reinf.";  partNumber = "865310P000";   supplier = #Keystone;  cost = 310.0; quantity = 1; status = #Arrived;     orderedDate = "2026-02-02"; arrivedDate = "2026-02-06"; notes = "" }),
      ("PT-10", { id = "PT-10"; workOrderId = "WO-0008"; partName = "Radiator Support";     partNumber = "64101-0P050";  supplier = #LKQ;       cost = 480.0; quantity = 1; status = #Arrived;     orderedDate = "2026-02-02"; arrivedDate = "2026-02-07"; notes = "" })
    ];
    for ((pid, p) in seedParts.vals()) {
      parts.add(pid, p);
    };
    partCounter := 10;
  };

  seedData();
};
