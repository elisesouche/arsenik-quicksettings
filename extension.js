/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

// import {loadInterfaceXML} from 'resource:///org/gnome/shell/misc/fileUtils.js';

// Pass the XML string to create a proxy class for that interface
// const Proxy = Gio.DBusProxy.makeProxyWrapper(interfaceXml);

function runServiceAction(proxy, action) {
    let arg = new GLib.Variant('(s)', [ "replace" ]);
    proxy.call_sync(
        action,
        arg,
        Gio.DBusCallFlags.NONE,
        -1,
        null
    );
}

const ExampleToggle = GObject.registerClass(
class ExampleToggle extends QuickToggle {
    _init() {
        super._init({
            title: _('Arsenik'),
            iconName: 'input-keyboard-symbolic',
            toggleMode: true,
        });

        let arg = new GLib.Variant('(s)', [ "kanata-arsenik.service" ]);
        let unitPathG = Gio.DBus.system.call_sync(
            "org.freedesktop.systemd1",
            "/org/freedesktop/systemd1",
            "org.freedesktop.systemd1.Manager",
            "GetUnit",
            arg,
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null
        );
        let unitPath = unitPathG.deepUnpack()[0];
        let proxy = Gio.DBusProxy.new_for_bus_sync(
            Gio.BusType.SYSTEM,
            Gio.DBusProxyFlags.GET_INVALIDATED_PROPERTIES,
            null,
            'org.freedesktop.systemd1',
            unitPath,
            'org.freedesktop.systemd1.Unit',
            null
        );

        this._proxy = proxy;

        this._proxy.connect('g-properties-changed', (_proxy, changed, _invalidated) => {
            const properties = changed.deepUnpack();
            for (const [name, value] of Object.entries(properties)) {
                if (name === "ActiveState") {
                    let status = value.get_string()[0];
                    if (status === "inactive") {
                        this.checked = false;
                    } else if (status === "active") {
                        this.checked = true;
                    }
                }
            }
        });

        this.connect('clicked', (_toggle) => {
            let action = _toggle.checked ? 'Start' : 'Stop';
            runServiceAction(this._proxy, action);
        });
    }
});

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    _init() {
        super._init();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'input-keyboard-symbolic';

        const toggle = new ExampleToggle();
        toggle.bind_property('checked',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);

        this.quickSettingsItems.push(toggle);
    }

});

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}
