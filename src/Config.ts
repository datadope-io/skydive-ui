import { Node, Link, NodeAttrs } from "./Topology";
import Tools from "./Tools";

const WEIGHT_NONE = 0;
const WEIGHT_SERVICE = 10;
const WEIGHT_COMPONENT = 20;
const WEIGHT_INSTANCE = 40;
const WEIGHT_ENDPOINT = 50;
const WEIGHT_SOFTWARE = 60;

const WEIGHT_FABRIC = 100;
const WEIGHT_PHYSICAL = 130;
const WEIGHT_BRIDGES = 140;
const WEIGHT_PORTS = 150;
const WEIGHT_VIRTUAL = 170;
const WEIGHT_NAMESPACES = 180;

const WEIGHT_VMS = 190;
const WEIGHT_SERVER = 200;
const WEIGHT_COMMUNICATIONS = 400;
const WEIGHT_DATACENTER = 500;

const WEIGHT_K8S_FEDERATION = 1000;
const WEIGHT_K8S_CLUSTER = 1010;
const WEIGHT_K8S_NODE = 1020;
const WEIGHT_K8S_POD = 1030;

var DefaultConfig = {
  subTitle: "",
  filters: [
    {
      id: "default",
      label: "Now",
      gremlin: "",
    },
    /* Leave as reference
    {
      id: "namespaces",
      label: "Namespaces",
      gremlin:
        "G.V().Has('Type', 'host').as('host')" +
        ".out().Has('Type', 'netns').descendants().as('netns')" +
        ".select('host', 'netns').SubGraph()",
    },
    */
  ],
  defaultFilter: "default",
  _newAttrs: function (node: Node): NodeAttrs {
    var name = node.data.Name;
    if (name.length > 24) {
      name = node.data.Name.substring(0, 24) + ".";
    }

    var attrs = {
      classes: [node.data.Type],
      name: name,
      icon: "\uf192",
      href: "",
      iconClass: "",
      weight: 0,
      badges: [],
      // Show this one if defined
      visible_name: node.data.VisibleName,
    };

    return attrs;
  },
  _nodeAttrsK8s: function (node: Node): NodeAttrs {
    var attrs = this._newAttrs(node);

    switch (node.data.Type) {
      case "cluster":
        attrs.href = "assets/icons/cluster.png";
        attrs.weight = WEIGHT_K8S_CLUSTER;
        break;
      case "configmap":
        attrs.href = "assets/icons/configmap.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "container":
        attrs.href = "assets/icons/container.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "cronjob":
        attrs.href = "assets/icons/cronjob.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "daemonset":
        attrs.href = "assets/icons/daemonset.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "deployment":
        attrs.href = "assets/icons/deployment.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "endpoints":
        attrs.href = "assets/icons/endpoints.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "ingress":
        attrs.href = "assets/icons/ingress.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "job":
        attrs.href = "assets/icons/job.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "node":
        attrs.icon = "\uf109";
        attrs.weight = WEIGHT_K8S_NODE;
        break;
      case "persistentvolume":
        attrs.href = "assets/icons/persistentvolume.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "persistentvolumeclaim":
        attrs.href = "assets/icons/persistentvolumeclaim.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "pod":
        attrs.href = "assets/icons/pod.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "networkpolicy":
        attrs.href = "assets/icons/networkpolicy.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "namespace":
        attrs.icon = "\uf24d";
        attrs.weight = WEIGHT_K8S_NODE;
        break;
      case "replicaset":
        attrs.href = "assets/icons/replicaset.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "replicationcontroller":
        attrs.href = "assets/icons/replicationcontroller.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "secret":
        attrs.href = "assets/icons/secret.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "service":
        attrs.href = "assets/icons/service.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "statefulset":
        attrs.href = "assets/icons/statefulset.png";
        attrs.weight = WEIGHT_K8S_POD;
        break;
      case "storageclass":
        attrs.href = "assets/icons/storageclass.png";
        attrs.weight = WEIGHT_K8S_NODE;
        break;
      default:
        attrs.href = "assets/icons/k8s.png";
        attrs.weight = WEIGHT_K8S_POD;
    }

    return attrs;
  },
  // Map Metadata.Icon string value to different icons
  iconMap: {
    Host: "\uf109",
    Component: "\uf24d",
    Application: "\uf1e0",
  },
  // Map Metadata.Badges[] string value to different icons
  // https://fontawesome.com/cheatsheet
  badgeMap: {
    Broker: "\uf084",
    Cluster: "\uf6ff",
    Node: "\uf109",
  },
  _nodeAttrsInfra: function (node: Node): NodeAttrs {
    var attrs = this._newAttrs(node);

    // Assign attributes based on Type, Icon and Badges
    const weight = this.weightTitles();

    if (weight.hasOwnProperty(node.data.Type)) {
      attrs.weight = weight[node.data.Type];

      // Use a predefined icon, or the \u code directly
      attrs.icon = this.iconMap[node.data.Icon] || node.data.Icon;

      if (node.data.Badges) {
        attrs.badges = node.data.Badges.map(
          (b) => this.badgeMap[b] || "\uf03d"
        );
      }

      // Add a alarm badge if any children have an alarm
      let alarm_warning = false;
      let alarm_critical = false;

      // Analyze node and children to get the most critical level.
      // Return boolean if critical has been found, to stop the analysis
      const DFSAlarmLevel  = (node: Node): boolean => {
        // First, analyze the node
        const nodeAlarmLevel = this.alarmLevel(node)
        if (nodeAlarmLevel === "critical") {
          alarm_critical = true
          return true
        } else if (nodeAlarmLevel === "warning") {
          alarm_warning = true
        }

        // If not critical found, analyze the children
        for (let index = 0; index < node.children.length; index++) {
          const child = node.children[index];
          if (DFSAlarmLevel(child)) {
            return true
          }
        }
        return false
      }

      DFSAlarmLevel(node)

      // skull-crossbones hearth if critical, exclamation mark if warning
      // TODO use a config parameter for the icons and pass them to Topology to draw in red/yellow
      if (alarm_critical) {
        attrs.badges = [...attrs.badges, "\uf714"]  // skull-crossbones
      } else if (alarm_warning) {
        attrs.badges = [...attrs.badges, "\uf071"]  // exclamation-triangle
      }

      // Reference of others possible parameters
      //attrs.href = "assets/icons/k8s.png"
      //attrs.iconClass = "font-brands"
      return attrs;
    }

    if (node.data.OfPort) {
      attrs.weight = WEIGHT_PORTS;
    }

    switch (node.data.Type) {
      case "host":
        attrs.icon = "\uf109";
        attrs.weight = WEIGHT_PHYSICAL;
        break;
      case "switch":
        attrs.icon = "\uf6ff";
        break;
      case "bridge":
      case "ovsbridge":
        attrs.icon = "\uf6ff";
        attrs.weight = WEIGHT_BRIDGES;
        break;
      case "erspan":
        attrs.icon = "\uf1e0";
        break;
      case "geneve":
      case "vxlan":
      case "gre":
      case "gretap":
        attrs.icon = "\uf55b";
        break;
      case "device":
      case "internal":
      case "interface":
      case "tun":
      case "tap":
        attrs.icon = "\uf796";
        attrs.weight = WEIGHT_VIRTUAL;
        break;
      case "veth":
        attrs.icon = "\uf4d7";
        attrs.weight = WEIGHT_VIRTUAL;
        break;
      case "switchport":
        attrs.icon = "\uf0e8";
        break;
      case "patch":
      case "port":
      case "ovsport":
        attrs.icon = "\uf0e8";
        attrs.weight = WEIGHT_PORTS;
        break;
      case "netns":
        attrs.icon = "\uf24d";
        attrs.weight = WEIGHT_NAMESPACES;
        break;
      case "libvirt":
        attrs.icon = "\uf109";
        attrs.weight = WEIGHT_VMS;
        break;
    }

    if (node.data.Manager === "docker") {
      attrs.icon = "\uf395";
      attrs.iconClass = "font-brands";
    }

    if (node.data.IPV4 && node.data.IPV4.length) {
      attrs.weight = WEIGHT_PHYSICAL;
    }

    var virt = ["tap", "veth", "tun", "openvswitch"];
    if (node.data.Driver && virt.indexOf(node.data.Driver) < 0) {
      attrs.weight = WEIGHT_PHYSICAL;
    }

    if (node.data.Probe === "fabric") {
      attrs.weight = WEIGHT_FABRIC;
    }

    if (node.data.Captures) {
      attrs.badges = ["\uf03d"];
    }

    return attrs;
  },
  nodeAttrs: function (node: Node): NodeAttrs {
    switch (node.data.Manager) {
      case "k8s":
        return this._nodeAttrsK8s(node);
      default:
        return this._nodeAttrsInfra(node);
    }
  },
  nodeSortFnc: function (a: Node, b: Node) {
    return a.data.Name.localeCompare(b.data.Name);
  },
  nodeClicked: function (node: Node) {
    window.App.tc.selectNode(node.id);
  },
  nodeDblClicked: function (node: Node) {
    window.App.tc.expand(node);
  },
  // Menu for right click on nodes
  nodeMenu: function (node: Node) {
    return [
      {
        class: "",
        text: "Expand all",
        disabled: false,
        callback: () => {
          window.App.tc.expand(node, true);
        },
      },
      {
        class: "",
        text: "Expand alarm",
        disabled: false,
        callback: () => {
          window.App.tc.expand_alarm(node);
        },
      },
      {
        class: "",
        text: "Capture",
        disabled: false,
        callback: () => {
          var api = new window.API.CapturesApi(window.App.apiConf);
          api
            .createCapture({ GremlinQuery: `G.V('${node.id}')` })
            .then((result) => {
              console.log(result);
            });
        },
      },
      {
        class: "",
        text: "Capture all",
        disabled: true,
        callback: () => {
          console.log("Capture all");
        },
      },
      {
        class: "",
        text: "Injection",
        disabled: false,
        callback: () => {
          console.log("Injection");
        },
      },
      {
        class: "",
        text: "Flows",
        disabled: false,
        callback: () => {
          console.log("Flows");
        },
      },
      {
        class: "",
        text: "Filter NS(demo)",
        disabled: false,
        callback: () => {
          window.App.loadExtraConfig("/assets/nsconfig.js");
        },
      },
    ];
  },
  // Tags associated to each host, used to filter
  nodeTags: function (data) {
    if (data.Tags && Array.isArray(data.Tags)) {
      return [...data.Tags, "All"];
    }
    return ["All"];
  },
  defaultNodeTag: "All",
  nodeTabTitle: function (node: Node): string {
    return node.data.Name.substring(0, 8);
  },
  // Number of nodes displayed when a group is displayed
  groupSize: 100,
  // The group type of each node
  groupType: function (node: Node): string | undefined {
    var nodeType = node.data.Type;
    if (!nodeType) {
      return;
    }

    // If the node has the SubType metadata value defined
    // group by that value instead of Type
    // TODO: group by Type if there are not enough SubType nodes to form a group
    if (node.data.SubType) {
      return node.data.SubType;
    }

    switch (nodeType) {
      case "configmap":
      case "cronjob":
      case "daemonset":
      case "deployment":
      case "endpoints":
      case "ingress":
      case "job":
      case "persistentvolume":
      case "persistentvolumeclaim":
      case "pod":
      case "networkpolicy":
      case "replicaset":
      case "replicationcontroller":
      case "secret":
      case "service":
      case "statefulset":
        return "app";
      default:
        return nodeType;
    }
  },
  groupName: function (node: Node): string | undefined {
    if (node.data.K8s) {
      var labels = node.data.K8s.Labels;
      if (!labels) {
        return name;
      }

      var app = labels["k8s-app"] || labels["app"];
      if (!app) {
        return "default";
      }
      return app;
    }

    var nodeType = this.groupType(node);
    if (!nodeType) {
      return;
    }

    return nodeType + "(s)";
  },
  weightTitles: function () {
    return {
      "Not classified": WEIGHT_NONE,
      Fabric: WEIGHT_FABRIC,
      Physical: WEIGHT_PHYSICAL,
      Service: WEIGHT_SERVICE,
      Component: WEIGHT_COMPONENT,
      Instance: WEIGHT_INSTANCE,
      Endpoint: WEIGHT_ENDPOINT,
      Software: WEIGHT_SOFTWARE,
      Bridges: WEIGHT_BRIDGES,
      Ports: WEIGHT_PORTS,
      Virtual: WEIGHT_VIRTUAL,
      Namespaces: WEIGHT_NAMESPACES,
      VMs: WEIGHT_VMS,
      Server: WEIGHT_SERVER,
      Communications: WEIGHT_COMMUNICATIONS,
      Datacenter: WEIGHT_DATACENTER,
      Federations: WEIGHT_K8S_FEDERATION,
      Clusters: WEIGHT_K8S_CLUSTER,
      Nodes: WEIGHT_K8S_NODE,
      Pods: WEIGHT_K8S_POD,
    };
  },
  suggestions: ["data.IPV4", "data.MAC", "data.Name"],
  nodeDataFields: [
    {
      field: "",
      title: "General",
      expanded: true,
      icon: "\uf05a",
      sortKeys: function (data) {
        return ["Name", "Type", "MAC", "Driver", "State"];
      },
      filterKeys: function (data) {
        switch (data.Type) {
          case "host":
            return ["Name"];
          default:
            return [
              "Name",
              "Type",
              "SubType",
              "VisibleName",
              "Tags",
              "Alarms",
              "MAC",
              "Driver",
              "State",
            ];
        }
      },
    },
    {
      field: "Alarms",
      expanded: false,
      icon: "\uf0a1",  // bullhorn
    },
    {
      field: "Sockets",
      expanded: false,
      icon: "\uf1e6",
    },
    {
      field: "Captures",
      expanded: false,
      icon: "\uf51f",
      normalizer: function (data) {
        for (let capture of data) {
          capture.ID = capture.ID.split("-")[0];
        }
        return data;
      },
    },
    {
      field: "Injections",
      expanded: false,
      icon: "\uf48e",
    },
    {
      field: "Docker",
      expanded: false,
      icon: "\uf395",
      iconClass: "font-brands",
    },
    {
      field: "IPV4",
      expanded: true,
      icon: "\uf1fa",
    },
    {
      field: "IPV6",
      expanded: true,
      icon: "\uf1fa",
    },
    {
      field: "LastUpdateMetric",
      title: "Last metrics",
      expanded: false,
      icon: "\uf201",
      normalizer: function (data) {
        return {
          RxPackets: data.RxPackets ? data.RxPackets.toLocaleString() : 0,
          RxBytes: data.RxBytes ? Tools.prettyBytes(data.RxBytes) : 0,
          TxPackets: data.TxPackets ? data.TxPackets.toLocaleString() : 0,
          TxBytes: data.TxPackets ? Tools.prettyBytes(data.TxBytes) : 0,
          Start: data.Start ? new Date(data.Start).toLocaleString() : 0,
          Last: data.Last ? new Date(data.Last).toLocaleString() : 0,
        };
      },
      graph: function (data) {
        return {
          type: "LineChart",
          data: [
            [{ type: "datetime", label: "time" }, "RxBytes", "TxBytes"],
            [new Date(data.Last || 0), data.RxBytes || 0, data.TxBytes || 0],
          ],
        };
      },
    },
    {
      field: "Metric",
      title: "Total metrics",
      expanded: false,
      icon: "\uf201",
      normalizer: function (data) {
        return {
          RxPackets: data.RxPackets ? data.RxPackets.toLocaleString() : 0,
          RxBytes: data.RxBytes ? Tools.prettyBytes(data.RxBytes) : 0,
          TxPackets: data.TxPackets ? data.TxPackets.toLocaleString() : 0,
          TxBytes: data.TxPackets ? Tools.prettyBytes(data.TxBytes) : 0,
          Last: data.Last ? new Date(data.Last).toLocaleString() : 0,
        };
      },
    },
    {
      field: "Features",
      expanded: false,
      icon: "\uf022",
    },
    {
      field: "FDB",
      expanded: false,
      icon: "\uf0ce",
    },
    {
      field: "Neighbors",
      expanded: false,
      icon: "\uf0ce",
    },
    {
      field: "RoutingTables",
      title: "Routing tables",
      expanded: false,
      icon: "\uf0ce",
      normalizer: function (data) {
        var rows = new Array<any>();
        for (let table of data) {
          if (!table.Routes) {
            continue;
          }
          for (let route of table.Routes) {
            if (!route.NextHops) {
              continue;
            }
            for (let nh of route.NextHops) {
              rows.push({
                ID: table.ID,
                Src: table.Src,
                Protocol: route["Protocol"],
                Prefix: route["Prefix"],
                Priority: nh["Priority"],
                IP: nh["IP"],
                IfIndex: nh["IfIndex"],
              });
            }
          }
        }

        return rows;
      },
    },
  ],
  linkAttrs: function (link: Link) {
    var metric = link.source.data.LastUpdateMetric;
    var bandwidth = 0;
    if (metric) {
      bandwidth = (metric.RxBytes + metric.TxBytes) * 8;
      bandwidth /= (metric.Last - metric.Start) / 1000;
    }

    var attrs = {
      classes: [link.data.RelationType],
      icon: "\uf362",
      directed: false,
      href: "",
      iconClass: "",
      label: bandwidth ? Tools.prettyBandwidth(bandwidth) : "",
    };

    if (bandwidth > 0) {
      attrs.classes.push("traffic");
    }

    if (link.data.RelationType === "layer2") {
      attrs.classes.push("traffic");
    }

    if (link.data.Directed) {
      attrs.directed = true;
    }

    return attrs;
  },
  linkTabTitle: function (link: Link) {
    var src = link.source.data.Name;
    var dst = link.target.data.Name;
    if (src && dst) {
      return src.substring(0, 8) + " / " + dst.substring(0, 8);
    }
    return link.id.split("-")[0];
  },
  linkDataFields: [
    {
      field: "",
      title: "General",
      expanded: true,
      icon: "\uf05a",
    },
    {
      field: "NSM",
      title: "Network Service Mesh",
      expanded: true,
      icon: "\uf542",
    },
    {
      field: "NSM.Source",
      title: "Source",
      expanded: false,
      icon: "\uf018",
    },
    {
      field: "NSM.Via",
      title: "Via",
      expanded: false,
      icon: "\uf018",
    },
    {
      field: "NSM.Destination",
      title: "Destination",
      expanded: false,
      icon: "\uf018",
    },
  ],

  // Default selector for the link menu
  defaultLinkTagMode: function (tag: string): number {
    // TODO convert the RelationType check into a function
    // ownership_ links are shown by default
    if (tag.slice(0,10) === "ownership_") {
      return 3
    }
    // network connection links are shown by default
    if (tag === "tcp_conn") {
      return 3
    }
    return 2;
  },

  // Analyze a Node to decide if it is in critical/warning/ok state
  // TODO move critical/warning/ok to enum?
  alarmLevel: function (node: Node): string {
    // Level to decide if an alarm is critical (from a suggested scale from 0 to 10)
    // Equal or greather than this level
    const alarmCriticalThreshold = 7

    if (
      node.data.Alarms &&
      Array.isArray(node.data.Alarms) &&
      node.data.Alarms.length > 0
    )
    {
      for (let index = 0; index < node.data.Alarms.length; index++) {
        const alarm = node.data.Alarms[index];
        if (alarm.level && alarm.level >= alarmCriticalThreshold) {
          return "critical";
        }
      }
      return "warning"
    }
    return "ok"
  }

};

export default DefaultConfig;
