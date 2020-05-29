/*
 * Copyright (C) 2019 Sylvain Afchain
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import React from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import SettingsIcon from '@material-ui/icons/Settings'
import Share from '@material-ui/icons/Share'
import GroupWork from '@material-ui/icons/GroupWork'
import InfoIcon from '@material-ui/icons/Info'
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks'
import { setTopologyType } from './Store'
import {TopologyType} from './TopologyType'
import { connect } from 'react-redux'

/* TODO move changing topology to redux
/* TODO implement as a different path?
/* https://reacttraining.com/react-router/web/api/Route

const unconnectedMainListItems = ({setTopologyType}) => {
  return (
    <div>
      <ListItem button
        onClick={(l) => {
          console.log("click svc topo", l)
          setTopologyType(TopologyType.Service)
        }}
      >
          <ListItemIcon>
              <GroupWork />
          </ListItemIcon>
          <ListItemText primary="Service topology" />
      </ListItem>
      <ListItem button
        onClick={(l) => {
          console.log("click network topo", l)
          setTopologyType(TopologyType.Network)
        }}
      >
          <ListItemIcon>
              <Share />
          </ListItemIcon>
          <ListItemText primary="Network topology" />
      </ListItem>
      <ListItem button>
          <ListItemIcon>
              <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
      </ListItem>
    </div>
  )
};

export const mapStateToProps = () => ({
})

export const mapDispatchToProps = ({
  setTopologyType
})

const MainListItems = connect(mapStateToProps, mapDispatchToProps)(unconnectedMainListItems);
*/

const MainListItems = ({changeTopology}) => {
  // TODO implement as a different path?
  // https://reacttraining.com/react-router/web/api/Route

  return (
    <div>
      <ListItem button
        onClick={(l) => {
          console.log("click svc topo", l)
          changeTopology(TopologyType.Service)
        }}
      >
          <ListItemIcon>
              <GroupWork />
          </ListItemIcon>
          <ListItemText primary="Service topology" />
      </ListItem>
      <ListItem button
        onClick={(l) => {
          console.log("click network topo", l)
          changeTopology(TopologyType.Network)
        }}
      >
          <ListItemIcon>
              <Share />
          </ListItemIcon>
          <ListItemText primary="Network topology" />
      </ListItem>
      <ListItem button>
          <ListItemIcon>
              <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
      </ListItem>
    </div>
  )
};

const helpListItems = (
    <div>
        <ListItem button>
            <ListItemIcon>
                <LibraryBooksIcon />
            </ListItemIcon>
            <ListItemText primary="Documentation" />
        </ListItem>
        <ListItem button>
            <ListItemIcon>
                <InfoIcon />
            </ListItemIcon>
            <ListItemText primary="About" />
        </ListItem>
    </div>
);

export {MainListItems, helpListItems}
